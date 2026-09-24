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


