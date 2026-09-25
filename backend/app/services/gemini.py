import json
import re
import time
from typing import Dict, Any, List
from google import genai
from google.genai import types
from google.genai.errors import APIError, ServerError
from app.core.config import settings

# Danh sách mô hình Gemini theo thứ tự ưu tiên (Tự động chuyển cấp khi một model chạm hạn mức 429 hoặc 503)
# Danh sách này đã được kiểm tra trực tiếp qua API client.models.list()
GEMINI_MODELS_CASCADE = [
    "gemini-3.5-flash",           # Rất nhanh, ổn định cao
    "gemini-3.5-flash-lite",      # Nhẹ hơn, quota cao
    "gemini-3.6-flash",           # Bản kế tiếp
    "gemini-3.7-flash",           # Bản nâng cao
    "gemini-3.8-flash",           # Bản mới nhất
    "gemini-3.1-flash-lite",      # Dự phòng
    "gemini-flash-latest",        # Alias tự động trỏ bản mới nhất
    "gemini-flash-lite-latest"    # Alias bản lite mới nhất
]


def clean_json_response(raw_text: str) -> str:
    """
    Loại bỏ các thẻ markdown ```json ... ``` nếu mô hình sinh ra,
    đảm bảo chuỗi trả về là JSON thuần túy để parse an toàn.
    """
    text = raw_text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

def call_gemini_with_retry(client, contents: str, system_instruction: str, temperature: float = 0.2) -> str:
    """
    Gọi Gemini với cơ chế Multi-tier Model Cascade:
    - Lần lượt thử qua các mô hình Flash theo danh sách GEMINI_MODELS_CASCADE.
    - Nếu gặp lỗi 429 (RESOURCE_EXHAUSTED / Hết quota ngày): Lập tức chuyển sang model kế tiếp mà không retry chờ vô ích.
    - Nếu gặp lỗi 503 (Server tạm quá tải): Thử lại 1 lần ngắn sau 1.5s trước khi chuyển model.
    - Đảm bảo hệ thống duy trì hoạt động thông suốt, không bị đứt đoạn.
    """
    last_exception = None

    for model_name in GEMINI_MODELS_CASCADE:
        print(f"[Gemini Cascade] Dang xu ly bang model: {model_name}...")
        for attempt in range(1, 3):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=temperature,
                        response_mime_type="application/json"
                    )
                )
                if response and response.text:
                    print(f"[Gemini Cascade] Thanh cong voi model: {model_name}")
                    return response.text
                else:
                    print(f"[Gemini Cascade] Model {model_name} phan hoi rong, chuyen model ke tiep...")
                    break
            except Exception as e:
                err_str = str(e)
                last_exception = e

                # Truong hop het han muc quota ngay (429 RESOURCE_EXHAUSTED) -> Nhay model ngay lap tuc
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                    print(f"[Gemini Cascade] Model {model_name} het quota (429), chuyen sang model tiep theo...")
                    break

                # Truong hop server Google tam ban (503 UNAVAILABLE) -> Thu lai 1 lan sau 1.5s
                if ("503" in err_str or "UNAVAILABLE" in err_str) and attempt < 2:
                    print(f"[Gemini Cascade] Model {model_name} tam ban (503), cho 1.5s thu lai lan 2...")
                    time.sleep(1.5)
                    continue

                print(f"[Gemini Cascade] Model {model_name} gap loi: {err_str[:120]}, thu model ke tiep...")
                break

    raise RuntimeError(f"Hệ thống đã thử toàn bộ danh sách Gemini models nhưng đều không phản hồi: {str(last_exception)}")

def analyze_viral_script(full_text: str, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Dùng Gemini để bóc tách cấu trúc tâm lý của video viral:
    - Khối Hook (3 giây đầu): Kỹ thuật thu hút, loại mồi câu.
    - Khối Body: Các điểm giữ chân, kỹ thuật ngắt nhịp (Pattern Interrupt).
    - Khối CTA: Kỹ thuật kêu gọi hành động cuối video.
    """
    if not settings.GEMINI_API_KEY or "your-gemini-key" in settings.GEMINI_API_KEY:
        raise ValueError(
            "Chưa cấu hình GEMINI_API_KEY hợp lệ trong file .env! "
            "Vui lòng lấy khóa thật tại: https://aistudio.google.com và dán vào file .env"
        )

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    system_instruction = """
    Bạn là một chuyên gia giải phẫu video ngắn triệu view (Short-form Video Strategist).
    Nhiệm vụ của bạn là nhận lời thoại kèm mốc thời gian của một video viral (TikTok, Reels, Shorts),
    sau đó phân tích cấu trúc tâm lý giữ chân người xem theo định dạng JSON nghiêm ngặt.

    Yêu cầu trả về đúng cấu trúc JSON sau, không kèm bất kỳ lời dẫn giải nào ngoài khối JSON:
    {
      "summary": "Tóm tắt ngắn gọn chủ đề video trong 1 câu",
      "hook": {
        "text": "Câu thoại mở đầu giữ chân người xem trong 3-5 giây đầu",
        "time_range": "Mốc thời gian (ví dụ: 00:00 - 00:03)",
        "hook_type": "Loại mồi câu (Ví dụ: Gây sốc / Đánh vào nỗi sợ / Bắt bẻ sai lầm / Đặt câu hỏi tò mò)",
        "why_it_works": "Giải thích vì sao câu này khiến người lướt ngón tay phải dừng lại"
      },
      "body": {
        "retention_tactics": [
          "Liệt kê các kỹ thuật giữ chân ở đoạn giữa (Ví dụ: Ngắt nhịp kể chuyện, đưa bằng chứng số liệu, tạo kịch tính)"
        ],
        "key_takeaways": [
          "Các bài học/thông tin cốt lõi người xem nhận được"
        ]
      },
      "cta": {
        "text": "Câu thoại kêu gọi hành động ở cuối video",
        "cta_type": "Loại kêu gọi (Ví dụ: Kêu gọi bình luận tranh cãi / Kêu gọi mua hàng / Thả tim lưu lại)",
        "effectiveness": "Đánh giá mức độ hiệu quả của câu chốt"
      }
    }
    """

    prompt = f"Dưới đây là lời thoại kèm mốc thời gian của video:\n{json.dumps(segments, ensure_ascii=False, indent=2)}"

    raw_response = call_gemini_with_retry(
        client=client,
        contents=prompt,
        system_instruction=system_instruction,
        temperature=0.2
    )

    cleaned_text = clean_json_response(raw_response)
    return json.loads(cleaned_text)

PERSONA_DESCRIPTIONS = {
    "ugc": "Người dùng thật / Reviewer gần gũi (Phong cách UGC): Đời thường, mộc mạc, nói chuyện như bạn bè tâm sự, mở đầu bằng trải nghiệm cá nhân thật, không màu mè quảng cáo.",
    "expert": "Chuyên gia / Phản biện bóc phốt: Sắc sảo, đanh thép, dẫn chứng số liệu thực tế, lật tẩy các hiểu lầm phổ biến trên mạng, tạo uy tín vững chắc.",
    "storyteller": "Người kể chuyện kịch tính (Drama / Storytelling): Tạo bầu không khí tò mò, hồi hộp, sử dụng các từ ngữ kích thích trí tưởng tượng và tạo nút thắt bất ngờ.",
    "humor": "Hài hước / Bắt trend châm biếm: Giọng điệu hóm hỉnh, bắt trend giới trẻ, giễu nhại các tình huống éo le đời sống để người xem bật cười và bấm share."
}

def remix_viral_script(analysis_data: Dict[str, Any], target_niche: str, persona: str = "ugc") -> Dict[str, Any]:
    """
    Tạo ra 3 kịch bản mới toanh bám sát đúng cấu trúc tâm lý của video triệu view,
    nhưng chuyển đổi toàn bộ nội dung sang ngành hàng/chủ đề và phong cách persona yêu cầu.
    Đồng thời sinh Bảng phân cảnh Storyboard (Visual Action, B-Roll AI Prompt, Text Overlay) chuẩn như Pippit.
    """
    if not settings.GEMINI_API_KEY or "your-gemini-key" in settings.GEMINI_API_KEY:
        raise ValueError("Chưa cấu hình GEMINI_API_KEY hợp lệ trong file .env!")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    persona_prompt = PERSONA_DESCRIPTIONS.get(persona, PERSONA_DESCRIPTIONS["ugc"])

    system_instruction = f"""
    Bạn là một đạo diễn kịch bản kiêm chuyên gia sản xuất video ngắn triệu view (TikTok, Reels, Shorts).
    Nhiệm vụ của bạn là lấy cấu trúc tâm lý của video viral đã phân tích, sau đó viết 3 kịch bản video ngắn mới (độ dài 45-60 giây) cho chủ đề/ngành hàng: "{target_niche}".

    Phong cách sáng tạo bắt buộc: {persona_prompt}

    Quy tắc viết:
    1. Giữ nguyên công thức giật tít của Hook, nhịp ngắt của Body và kiểu chốt của CTA từ bản gốc.
    2. Văn phong 100% tự nhiên, sắc bén, đời thường như người thật nói chuyện, cấm dùng từ sáo rỗng AI.
    3. Với MỖI kịch bản, bắt buộc phải cung cấp một Bảng phân cảnh Storyboard chi tiết (gồm 3 đến 5 cảnh) để creator cầm máy quay hoặc đưa vào các công cụ AI video (như Pippit, Seedance, Runway, Midjourney) để sản xuất ngay.

    Trả về đúng định dạng JSON chuẩn:
    {{
      "target_niche": "{target_niche}",
      "persona": "{persona}",
      "scripts": [
        {{
          "version": "Phiên bản 1 (Trực diện / Gây tò mò)",
          "tone_style": "Tóm tắt phong cách giọng điệu (ngắn gọn 1 câu)",
          "estimated_duration": "45-50 giây",
          "hook": "Câu mở đầu 3 giây",
          "body": "Nội dung thân bài chia theo từng nhịp nói",
          "cta": "Câu chốt kêu gọi hành động",
          "full_script": "Toàn bộ kịch bản hoàn chỉnh để người dùng cầm đọc quay luôn",
          "storyboard": [
            {{
              "scene": 1,
              "time": "00:00 - 00:03",
              "stage": "Hook",
              "voiceover": "Câu thoại mở đầu 3s",
              "visual_action": "Chỉ dẫn chi tiết góc máy (Cận cảnh / POV / Góc rộng), nét mặt và hành động cụ thể của diễn viên",
              "b_roll_prompt": "Prompt tiếng Anh điện ảnh chi tiết để tạo video/ảnh B-roll minh họa bằng AI (cinematic, photorealistic, 8k)",
              "text_overlay": "Dòng chữ giật tít lớn chạy trên màn hình (caption ngắn gọn)"
            }},
            {{
              "scene": 2,
              "time": "00:03 - 00:15",
              "stage": "Body",
              "voiceover": "Câu thoại phần thân bài",
              "visual_action": "Chỉ dẫn hành động và chuyển động camera",
              "b_roll_prompt": "Prompt tiếng Anh cho cảnh quay B-roll",
              "text_overlay": "Chữ tóm tắt luận điểm trên màn hình"
            }},
            {{
              "scene": 3,
              "time": "00:15 - 00:35",
              "stage": "Body",
              "voiceover": "Câu thoại đưa bằng chứng hoặc giải pháp",
              "visual_action": "Chỉ dẫn hành động",
              "b_roll_prompt": "Prompt tiếng Anh cảnh minh họa giải pháp",
              "text_overlay": "Chữ nhấn mạnh giải pháp"
            }},
            {{
              "scene": 4,
              "time": "00:35 - 00:45",
              "stage": "CTA",
              "voiceover": "Câu thoại kêu gọi hành động cuối video",
              "visual_action": "Chỉ dẫn hành động chốt (ví dụ: chỉ tay vào giỏ hàng hoặc nút Follow)",
              "b_roll_prompt": "Prompt tiếng Anh cảnh kết",
              "text_overlay": "FOLLOW NGAY / BẤM VÀO GIỎ HÀNG"
            }}
          ]
        }},
        {{
          "version": "Phiên bản 2 (Kể chuyện / Nỗi sợ)",
          "tone_style": "Tóm tắt phong cách",
          "estimated_duration": "45-50 giây",
          "hook": "Câu mở đầu 3 giây",
          "body": "Nội dung thân bài",
          "cta": "Câu chốt kêu gọi hành động",
          "full_script": "Toàn bộ kịch bản",
          "storyboard": [
            {{
              "scene": 1,
              "time": "00:00 - 00:03",
              "stage": "Hook",
              "voiceover": "Câu mở đầu",
              "visual_action": "Chỉ dẫn góc máy và diễn xuất",
              "b_roll_prompt": "Prompt tiếng Anh",
              "text_overlay": "Chữ giật tít"
            }},
            {{
              "scene": 2,
              "time": "00:03 - 00:20",
              "stage": "Body",
              "voiceover": "Câu thoại",
              "visual_action": "Chỉ dẫn diễn xuất",
              "b_roll_prompt": "Prompt tiếng Anh",
              "text_overlay": "Chữ tóm tắt"
            }},
            {{
              "scene": 3,
              "time": "00:20 - 00:45",
              "stage": "CTA",
              "voiceover": "Câu thoại kết",
              "visual_action": "Chỉ dẫn diễn xuất",
              "b_roll_prompt": "Prompt tiếng Anh",
              "text_overlay": "Chữ kêu gọi"
            }}
          ]
        }},
        {{
          "version": "Phiên bản 3 (Hài hước / Bắt bẻ định kiến)",
          "tone_style": "Tóm tắt phong cách",
          "estimated_duration": "45-50 giây",
          "hook": "Câu mở đầu 3 giây",
          "body": "Nội dung thân bài",
          "cta": "Câu chốt kêu gọi hành động",
          "full_script": "Toàn bộ kịch bản",
          "storyboard": [
            {{
              "scene": 1,
              "time": "00:00 - 00:03",
              "stage": "Hook",
              "voiceover": "Câu mở đầu",
              "visual_action": "Chỉ dẫn góc máy và diễn xuất",
              "b_roll_prompt": "Prompt tiếng Anh",
              "text_overlay": "Chữ giật tít"
            }},
            {{
              "scene": 2,
              "time": "00:03 - 00:20",
              "stage": "Body",
              "voiceover": "Câu thoại",
              "visual_action": "Chỉ dẫn diễn xuất",
              "b_roll_prompt": "Prompt tiếng Anh",
              "text_overlay": "Chữ tóm tắt"
            }},
            {{
              "scene": 3,
              "time": "00:20 - 00:45",
              "stage": "CTA",
              "voiceover": "Câu thoại kết",
              "visual_action": "Chỉ dẫn diễn xuất",
              "b_roll_prompt": "Prompt tiếng Anh",
              "text_overlay": "Chữ kêu gọi"
            }}
          ]
        }}
      ]
    }}
    """

    prompt = f"Cấu trúc kịch bản video gốc cần clone nhịp điệu:\n{json.dumps(analysis_data, ensure_ascii=False, indent=2)}"

    raw_response = call_gemini_with_retry(
        client=client,
        contents=prompt,
        system_instruction=system_instruction,
        temperature=0.7
    )

    cleaned_text = clean_json_response(raw_response)
    return json.loads(cleaned_text)
