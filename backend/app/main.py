import sys
import io

# Đảm bảo console trên Windows luôn hỗ trợ in tiếng Việt và ký tự đặc biệt mà không bị crash mã UnicodeEncodeError
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from collections import defaultdict
import time
import secrets

from app.services.audio import extract_audio_from_url, cleanup_audio_file
from app.services.groq_stt import transcribe_audio_groq
from app.services.gemini import analyze_viral_script, remix_viral_script
from app.services.db import (
    save_analysis_result,
    save_remixed_script,
    deduct_credit_from_user,
    get_user_profile,
    create_order,
    activate_order
)

app = FastAPI(
    title="Viral Script AI Engine",
    description="Hệ thống giải phẫu video ngắn triệu view và tái cấu trúc kịch bản theo ngành hàng",
    version="1.0.0"
)

# Cho phép giao diện Frontend Next.js gọi API mượt mà không bị lỗi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── BỘ ĐẾM HẠN MỨC CHO KHÁCH VÃNG LAI (GUEST RATE LIMITER) ────────────────────
# Giới hạn khách chưa đăng nhập chỉ được phân tích tối đa 2 video
guest_ip_tracker = defaultdict(int)

# ─── ĐỊNH NGHĨA KHUÔN MẪU DỮ LIỆU ĐẦU VÀO (PYDANTIC SCHEMAS) ───────────────────
class AnalyzeRequest(BaseModel):
    video_url: str
    user_id: Optional[str] = None
    guest_id: Optional[str] = None

class RemixRequest(BaseModel):
    analysis_data: Dict[str, Any]
    target_niche: str
    persona: Optional[str] = "ugc"
    analysis_id: Optional[str] = None
    user_id: Optional[str] = None

class CreateOrderRequest(BaseModel):
    user_id: str
    plan_type: str

class ConfirmOrderRequest(BaseModel):
    user_id: str
    order_code: str

class FeedbackRequest(BaseModel):
    message: str
    rating: Optional[int] = None       # 1-5 sao, optional
    email: Optional[str] = None        # Email khách vãng lai
    user_id: Optional[str] = None
    page_context: Optional[str] = None # Trang đang dùng khi gửi feedback

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    conversation_history: Optional[list] = []  # Lịch sử hội thoại để giữ ngữ cảnh


# ─── CÁC CỔNG GIAO TIẾP API (ENDPOINTS) ─────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Viral Script AI Backend",
        "version": "1.0.0"
    }

@app.get("/api/user/profile")
async def user_profile(user_id: str, authorization: Optional[str] = Header(None)):
    jwt_token = authorization.split("Bearer ")[1].strip() if authorization and authorization.startswith("Bearer ") else None
    return get_user_profile(user_id, jwt_token=jwt_token)

@app.post("/api/analyze")
async def analyze_video(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Quy trình xử lý trọn gói kèm kiểm soát hạn mức:
    1. Kiểm tra quyền và số dư lượt dùng (Khách vãng lai tối đa 2 lần; User đăng nhập có 3 lượt/ngày).
    2. Bóc tách âm thanh 16kHz Mono từ link video.
    3. Nhận diện giọng nói Groq Whisper.
    4. Gemini giải phẫu Hook, Body, CTA.
    5. Lưu kết quả vào Supabase.
    """
    start_time = time.time()
    url = request.video_url.strip()

    if not url:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp link video hợp lệ.")

    # Trích xuất Bearer token từ Header nếu người dùng đã đăng nhập
    jwt_token = None
    if authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split("Bearer ")[1].strip()

    # ─── 1. KIỂM TRA HẠN MỨC NGHIÊM NGẶT ──────────────────────────────────────
    remaining_credits = None
    user_tier = "free"
    guest_key = None

    if not request.user_id:
        # Khách vãng lai: Định danh bằng guest_id (hoặc fallback IP nếu thiếu)
        guest_key = (request.guest_id or "").strip()
        if not guest_key:
            guest_key = http_request.client.host if http_request.client else "127.0.0.1"

        if guest_ip_tracker[guest_key] >= 2:
            raise HTTPException(
                status_code=403,
                detail="Bạn đã sử dụng hết 2 lượt trải nghiệm miễn phí cho khách. Vui lòng đăng nhập hoặc đăng ký tài khoản để nhận tiếp 3 lượt phân tích kịch bản mỗi ngày!"
            )
    else:
        # Thành viên đã đăng nhập: Trừ lượt nguyên tử trong database
        credit_check = deduct_credit_from_user(request.user_id, jwt_token=jwt_token)
        if not credit_check.get("success"):
            raise HTTPException(
                status_code=402,
                detail="Tài khoản của bạn đã dùng hết số lượt miễn phí hôm nay. Vui lòng nạp thêm lượt hoặc nâng cấp gói Pro để tiếp tục."
            )
        remaining_credits = credit_check.get("remaining")
        user_tier = credit_check.get("tier", "free")

    # ─── 2. BÓC TÁCH ÂM THANH ────────────────────────────────────────────────
    try:
        audio_info = extract_audio_from_url(url)
        audio_path = audio_info["file_path"]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Lên lịch xóa file âm thanh tạm ngay sau khi hoàn tất
    background_tasks.add_task(cleanup_audio_file, audio_path)

    # ─── 3. NHẬN DIỆN GIỌNG NÓI GROQ WHISPER ─────────────────────────────────
    try:
        stt_result = transcribe_audio_groq(audio_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ─── 4. GIẢI PHẪU KỊCH BẢN QUA GEMINI ────────────────────────────────────
    try:
        analysis_result = analyze_viral_script(
            full_text=stt_result["full_text"],
            segments=stt_result["segments"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ─── 5. LƯU KẾT QUẢ VÀO SUPABASE ─────────────────────────────────────────
    saved_analysis_id = None
    try:
        saved_analysis_id = save_analysis_result(
            video_url=audio_info["clean_url"],
            platform=audio_info["platform"],
            transcript_data={"segments": stt_result["segments"], "full_text": stt_result["full_text"]},
            hook_analysis=analysis_result.get("hook", {}),
            body_analysis=analysis_result.get("body", {}),
            cta_analysis=analysis_result.get("cta", {}),
            user_id=request.user_id,
            jwt_token=jwt_token
        )
    except Exception as e:
        print(f"[Supabase Warning] Khong the luu vao DB: {e}")

    # Chỉ trừ lượt của khách vãng lai sau khi bóc tách kịch bản THÀNH CÔNG
    remaining_guest_uses = None
    if not request.user_id and guest_key:
        guest_ip_tracker[guest_key] += 1
        remaining_guest_uses = max(0, 2 - guest_ip_tracker[guest_key])

    total_processing_time = round(time.time() - start_time, 2)

    return {
        "status": "success",
        "saved_to_db": bool(saved_analysis_id),
        "analysis_id": saved_analysis_id,
        "remaining_credits": remaining_credits,
        "remaining_guest_uses": remaining_guest_uses,
        "user_tier": user_tier,
        "processing_time_seconds": total_processing_time,
        "video_metadata": {
            "title": audio_info["title"],
            "duration": audio_info["duration_seconds"],
            "platform": audio_info["platform"],
            "url": audio_info["clean_url"]
        },
        "transcript": {
            "full_text": stt_result["full_text"],
            "segments": stt_result["segments"]
        },
        "script_analysis": analysis_result
    }

@app.post("/api/remix")
async def remix_script(
    request: RemixRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Tái cấu trúc 3 kịch bản mới theo ngành hàng và tự động lưu vào bảng remixed_scripts trên Supabase.
    """
    try:
        remixed_data = remix_viral_script(
            analysis_data=request.analysis_data,
            target_niche=request.target_niche,
            persona=request.persona or "ugc"
        )

        jwt_token = None
        if authorization and authorization.startswith("Bearer "):
            jwt_token = authorization.split("Bearer ")[1].strip()

        saved_remix_id = None
        if request.analysis_id:
            import json
            saved_remix_id = save_remixed_script(
                analysis_id=request.analysis_id,
                target_niche=request.target_niche,
                generated_script=json.dumps(remixed_data, ensure_ascii=False),
                user_id=request.user_id,
                jwt_token=jwt_token
            )

        return {
            "status": "success",
            "saved_to_db": bool(saved_remix_id),
            "remix_id": saved_remix_id,
            "data": remixed_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── CÁC CỔNG GIAO DỊCH & NẠP LƯỢT THANH TOÁN (PAYMENT ENDPOINTS) ──────────────

@app.post("/api/payment/create-order")
async def create_payment_order(
    request: CreateOrderRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Khởi tạo đơn hàng thanh toán và trả về thông tin chuyển khoản chuẩn ví VNPAY chính chủ.
    """
    jwt_token = authorization.split("Bearer ")[1].strip() if authorization and authorization.startswith("Bearer ") else None

    plan_config = {
        "single_5k": {"amount": 5000, "credits": 1, "name": "Gói lẻ 1 kịch bản"},
        "pack_20k": {"amount": 20000, "credits": 5, "name": "Combo 5 kịch bản"},
        "pro_monthly_99k": {"amount": 99000, "credits": 9999, "name": "Gói Pro Creator 1 Tháng"},
    }

    if request.plan_type not in plan_config:
        raise HTTPException(status_code=400, detail="Gói cước không hợp lệ.")

    cfg = plan_config[request.plan_type]
    order_code = f"VS{secrets.token_hex(3).upper()}"

    create_order(
        user_id=request.user_id,
        plan_type=request.plan_type,
        amount=cfg["amount"],
        credits_added=cfg["credits"],
        order_code=order_code,
        jwt_token=jwt_token
    )

    return {
        "status": "success",
        "order_code": order_code,
        "amount": cfg["amount"],
        "plan_name": cfg["name"],
        "account_name": "NGUYEN LE BAO PHONG",
        "account_no": "0834490939",
        "bank_name": "Ví VNPAY",
        "transfer_content": f"VS {order_code}",
        "qr_image": "/vnpay_qr.png"
    }

@app.post("/api/payment/confirm-order")
async def confirm_payment_order(
    request: ConfirmOrderRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Xác nhận giao dịch chuyển tiền thành công và cộng số lượt vào tài khoản.
    """
    jwt_token = authorization.split("Bearer ")[1].strip() if authorization and authorization.startswith("Bearer ") else None

    res = activate_order(
        order_code=request.order_code,
        user_id=request.user_id,
        jwt_token=jwt_token
    )

    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("reason", "Không thể kích hoạt đơn hàng."))

    return {
        "status": "success",
        "credits": res.get("credits"),
        "tier": res.get("tier")
    }


# ─── ENDPOINT 5: GỬI PHẢN HỒI / ĐÁNH GIÁ (FEEDBACK) ─────────────────────────────
@app.post("/api/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Nhận đánh giá từ người dùng và lưu vào bảng feedback trong Supabase.
    Hỗ trợ cả khách vãng lai (user_id = None) và tài khoản đã đăng nhập.
    """
    from app.services.db import get_supabase_client

    # Validate rating nếu có
    if request.rating is not None and not (1 <= request.rating <= 5):
        raise HTTPException(status_code=422, detail="Rating phải nằm trong khoảng 1 đến 5.")

    # Kiểm tra message không được rỗng
    message = request.message.strip()
    if not message or len(message) < 5:
        raise HTTPException(status_code=422, detail="Nội dung đánh giá quá ngắn. Vui lòng nhập tối thiểu 5 ký tự.")
    if len(message) > 2000:
        raise HTTPException(status_code=422, detail="Nội dung đánh giá vượt quá 2000 ký tự.")

    jwt_token = authorization.split("Bearer ")[1].strip() if authorization and authorization.startswith("Bearer ") else None
    supabase = get_supabase_client(jwt_token=jwt_token)

    if supabase:
        try:
            feedback_data = {
                "message": message,
                "rating": request.rating,
                "email": request.email,
                "user_id": request.user_id,
                "page_context": request.page_context or "general",
            }
            supabase.table("feedback").insert(feedback_data).execute()
        except Exception as e:
            print(f"Lỗi lưu feedback: {e}")
            # Không raise lỗi — feedback không được làm crash trải nghiệm user

    return {"status": "success", "message": "Cảm ơn bạn đã gửi đánh giá!"}


# ─── ENDPOINT 6: CHATBOT HỖ TRỢ NGƯỜI DÙNG ──────────────────────────────────────
# System prompt mô tả đầy đủ tính năng ViralScript AI để chatbot trả lời đúng ngữ cảnh
CHATBOT_SYSTEM_PROMPT = """Bạn là ViralBot — trợ lý AI hỗ trợ người dùng ứng dụng ViralScript AI.

ViralScript AI là công cụ giúp phân tích kịch bản video ngắn viral (TikTok, YouTube Shorts, Instagram Reels) và tái cấu trúc kịch bản cho video mới.

Các tính năng chính của ViralScript AI:
1. **Phân Tích Script**: Dán link video TikTok/YouTube Shorts/Reels → AI bóc tách toàn bộ cấu trúc: Hook 3 giây, kỹ thuật giữ chân, CTA
2. **Remix Kịch Bản**: Sau khi phân tích, tạo 3 kịch bản mới theo ngành hàng khác nhau (UGC bán hàng, Tech, Drama, F&B...)
3. **Teleprompter**: Máy nhắc chữ tích hợp để quay video ngay sau khi có kịch bản
4. **Thư Viện Mẫu**: Bộ công thức kịch bản Hook-Body-CTA đã được chứng minh hiệu quả
5. **Lịch Sử Kịch Bản**: Lưu và xem lại các phân tích đã thực hiện

Hệ thống lượt dùng:
- Khách vãng lai: 2 lượt thử miễn phí
- Tài khoản free: 3 lượt mỗi ngày (tự động hồi phục lúc 0h hàng ngày)
- Gói lẻ: Nạp từ 5.000đ/lượt
- Gói Pro VIP (99k/tháng): Không giới hạn lượt

Định dạng trả lời:
- Trả lời bằng tiếng Việt đầy đủ, trọn vẹn ý nghĩa, rõ ràng, thân thiện và thực tế. Luôn hoàn thành toàn bộ câu trả lời, tuyệt đối không ngắt quãng giữa chừng.
- Trình bày mạch lạc, có thể dùng gạch đầu dòng ngắn khi liệt kê tính năng hoặc gói cước để người dùng dễ đọc.
- Nếu không biết hoặc vấn đề kỹ thuật sâu, hãy hướng dẫn user liên hệ hỗ trợ qua Zalo/Hotline 0834.490.939.
- Không bịa đặt thông tin hoặc tính năng không có trong danh sách trên.
"""

@app.post("/api/chat")
async def chat_with_bot(request: ChatRequest):
    """
    Chatbot hỗ trợ người dùng sử dụng ViralScript AI.
    Dùng Gemini (google-genai SDK) để trả lời câu hỏi trong ngữ cảnh ứng dụng.
    Hỗ trợ lịch sử hội thoại để giữ ngữ cảnh xuyên suốt phiên chat.
    """
    from google import genai as google_genai
    from google.genai import types as genai_types
    from app.core.config import settings

    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(status_code=422, detail="Câu hỏi không được để trống.")
    if len(user_message) > 500:
        raise HTTPException(status_code=422, detail="Câu hỏi quá dài. Vui lòng rút gọn xuống dưới 500 ký tự.")

    # Kiểm tra GEMINI_API_KEY hợp lệ
    if not settings.GEMINI_API_KEY or "your-gemini-key" in settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("your_"):
        return {
            "reply": "Xin lỗi, chatbot chưa được kích hoạt. Vui lòng liên hệ hỗ trợ qua Zalo 0834.490.939.",
            "status": "config_error"
        }

    try:
        client = google_genai.Client(api_key=settings.GEMINI_API_KEY)

        # Xây dựng lịch sử hội thoại dạng list contents cho SDK google-genai
        # Mỗi turn là dict {"role": "user"|"model", "parts": [{"text": "..."}]}
        contents = []
        for turn in (request.conversation_history or [])[-8:]:  # Giữ tối đa 8 lượt gần nhất
            role = turn.get("role")
            content = turn.get("content", "").strip()
            if role in ("user", "model") and content:
                contents.append(
                    genai_types.Content(
                        role=role,
                        parts=[genai_types.Part(text=content)]
                    )
                )

        # Thêm câu hỏi hiện tại vào cuối
        contents.append(
            genai_types.Content(
                role="user",
                parts=[genai_types.Part(text=user_message)]
            )
        )

        # Thử lần lượt các model từ cascade (ưu tiên các model đang hoạt động thực tế trên Google AI Studio)
        CHAT_MODELS = [
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-3.8-flash",
            "gemini-flash-latest",
            "gemini-flash-lite-latest"
        ]
        last_error = None

        for model_name in CHAT_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=CHATBOT_SYSTEM_PROMPT,
                        temperature=0.7,
                        # Tắt thinking ngầm để không ngốn hết token budget gây đứt câu giữa chừng
                        thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
                        max_output_tokens=1500  # Đủ dài để trả lời hoàn chỉnh, trọn vẹn câu
                    )
                )


                if response and response.text:
                    print(f"[ChatBot] Thanh cong voi model: {model_name}")
                    return {"reply": response.text.strip(), "status": "success"}
                else:
                    print(f"[ChatBot] Model {model_name} tra ve phan hoi rong, thu model ke tiep...")
                    continue

            except Exception as model_err:
                err_str = str(model_err)
                last_error = model_err
                print(f"[ChatBot] Model {model_name} loi: {err_str[:120]}")

                # Quota hết → chuyển model ngay
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                    continue
                # Lỗi khác → cũng thử model kế tiếp
                continue

        print(f"[ChatBot] Tat ca model deu that bai. Loi cuoi: {last_error}")
        return {
            "reply": "Chatbot đang quá tải. Vui lòng thử lại sau ít phút hoặc liên hệ Zalo 0834.490.939.",
            "status": "error"
        }

    except Exception as e:
        print(f"[ChatBot] Loi khoi tao client Gemini: {e}")
        return {
            "reply": "Xin lỗi, chatbot gặp sự cố kỹ thuật. Vui lòng liên hệ hỗ trợ qua Zalo 0834.490.939.",
            "status": "error"
        }

