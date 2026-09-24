import re
from typing import Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings

def get_clean_supabase_url() -> str:
    """
    Tự động chuẩn hóa đường dẫn Supabase URL:
    Cắt bỏ đuôi /rest/v1/ nếu người dùng lỡ copy thừa từ bảng điều khiển API.
    """
    raw_url = settings.SUPABASE_URL.strip()
    clean_url = re.sub(r"/rest/v1/?$", "", raw_url).rstrip("/")
    return clean_url

def get_supabase_client(jwt_token: Optional[str] = None) -> Optional[Client]:
    """
    Khởi tạo kết nối tới cơ sở dữ liệu Supabase trên đám mây.
    Nếu có jwt_token từ phiên đăng nhập của người dùng, gắn quyền vào PostgREST để thỏa mãn luật RLS.
    """
    clean_url = get_clean_supabase_url()
    if not clean_url or not settings.SUPABASE_KEY:
        return None
    if "your-project" in clean_url or "your-anon-key" in settings.SUPABASE_KEY:
        return None

    try:
        client = create_client(clean_url, settings.SUPABASE_KEY)
        if jwt_token:
            client.postgrest.auth(jwt_token)
        return client
    except Exception as e:
        print(f"Lỗi khởi tạo Supabase Client: {e}")
        return None

def save_analysis_result(
    video_url: str,
    platform: str,
    transcript_data: Dict[str, Any],
    hook_analysis: Dict[str, Any],
    body_analysis: Dict[str, Any],
    cta_analysis: Dict[str, Any],
    user_id: Optional[str] = None,
    jwt_token: Optional[str] = None
) -> Optional[str]:
    """
    Lưu kết quả bóc tách kịch bản vào bảng 'analyses' trên Supabase.
    Trả về ID của bản ghi vừa lưu.
    """
    supabase = get_supabase_client(jwt_token=jwt_token)
    if not supabase:
        return None

    # Tự động trích xuất user_id từ JWT nếu người dùng chưa gửi kèm
    if jwt_token and not user_id:
        try:
            user_resp = supabase.auth.get_user(jwt_token)
            if user_resp and user_resp.user:
                user_id = str(user_resp.user.id)
        except Exception as e:
            print(f"Không thể giải mã user từ token: {e}")

    try:
        data_payload = {
            "video_url": video_url,
            "video_platform": platform,
            "transcript_data": transcript_data,
            "hook_analysis": hook_analysis,
            "body_analysis": body_analysis,
            "cta_analysis": cta_analysis,
        }
        if user_id:
            data_payload["user_id"] = user_id

        response = supabase.table("analyses").insert(data_payload).execute()
        if response.data and len(response.data) > 0:
            inserted_id = response.data[0].get("id")
            print(f"[Supabase] Da luu kich ban thanh cong! ID: {inserted_id}")
            return inserted_id
        return None
    except Exception as e:
        print(f"[Supabase] Khong the luu vao Supabase: {e}")
        return None

def save_remixed_script(
    analysis_id: str,
    target_niche: str,
    generated_script: str,
    user_id: Optional[str] = None,
    jwt_token: Optional[str] = None
) -> Optional[str]:
    """
    Lưu kịch bản viết lại vào bảng 'remixed_scripts' trên Supabase.
    """
    supabase = get_supabase_client(jwt_token=jwt_token)
    if not supabase:
        return None

    if jwt_token and not user_id:
        try:
            user_resp = supabase.auth.get_user(jwt_token)
            if user_resp and user_resp.user:
                user_id = str(user_resp.user.id)
        except Exception as e:
            print(f"Không thể giải mã user từ token: {e}")

    try:
        data_payload = {
            "analysis_id": analysis_id,
            "target_niche": target_niche,
            "generated_script": generated_script,
        }
        if user_id:
            data_payload["user_id"] = user_id

        response = supabase.table("remixed_scripts").insert(data_payload).execute()
        if response.data and len(response.data) > 0:
            inserted_id = response.data[0].get("id")
            print(f"[Supabase] Da luu kich ban remix thanh cong! ID: {inserted_id}")
            return inserted_id
        return None
    except Exception as e:
        print(f"[Supabase] Khong the luu kich ban remix vao Supabase: {e}")
        return None

def deduct_credit_from_user(user_id: str, jwt_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Trừ 1 lượt của user trong database.
    Ưu tiên gọi hàm PostgreSQL RPC 'deduct_user_credit' (an toàn tuyệt đối, chống race condition).
    Nếu chưa nạp RPC thì dùng fallback truy vấn trực tiếp trên bảng profiles.
    """
    supabase = get_supabase_client(jwt_token=jwt_token)
    if not supabase:
        return {"success": True, "remaining": 2, "tier": "free"}

    # 1. Thử gọi hàm RPC nguyên tử trong PostgreSQL
    try:
        rpc_res = supabase.rpc("deduct_user_credit", {"p_user_id": user_id}).execute()
        if rpc_res and rpc_res.data:
            return rpc_res.data
    except Exception as e:
        print(f"Lưu ý: Chưa chạy RPC deduct_user_credit trong Supabase ({e}). Chuyển sang fallback bảng profiles.")

    # 2. Fallback kiểm tra và cập nhật trực tiếp trên bảng profiles
    try:
        prof_res = supabase.table("profiles").select("daily_credits, last_reset_date, subscription_tier").eq("id", user_id).execute()
        if not prof_res.data or len(prof_res.data) == 0:
            # Nếu user vừa tạo mà chưa có dòng profiles, tạo mặc định 2 lượt (đã tính lần này)
            try:
                supabase.table("profiles").upsert({"id": user_id, "daily_credits": 2, "subscription_tier": "free"}).execute()
            except Exception:
                pass
            return {"success": True, "remaining": 2, "tier": "free"}

        prof = prof_res.data[0]
        tier = prof.get("subscription_tier") or "free"
        if tier == "pro":
            return {"success": True, "remaining": 9999, "tier": "pro"}

        current_credits = prof.get("daily_credits")
        if current_credits is None:
            current_credits = 3

        if current_credits <= 0:
            return {"success": False, "reason": "out_of_credits", "remaining": 0, "tier": tier}

        new_credits = current_credits - 1
        supabase.table("profiles").update({"daily_credits": new_credits}).eq("id", user_id).execute()
        return {"success": True, "remaining": new_credits, "tier": tier}
    except Exception as e:
        print(f"Lỗi khi trừ lượt fallback: {e}")
        return {"success": True, "remaining": 1, "tier": "free"}

def get_user_profile(user_id: str, jwt_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Lấy thông tin số lượt còn lại và gói của người dùng.
    """
    supabase = get_supabase_client(jwt_token=jwt_token)
    if not supabase:
        return {"daily_credits": 3, "subscription_tier": "free"}

    try:
        res = supabase.table("profiles").select("id, email, daily_credits, subscription_tier").eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return {"daily_credits": 3, "subscription_tier": "free"}
    except Exception as e:
        print(f"Lỗi khi đọc profile: {e}")
        return {"daily_credits": 3, "subscription_tier": "free"}

# Bộ nhớ đệm đơn hàng dự phòng (giúp hệ thống hoạt động ngay cả khi người dùng chưa kịp chạy SQL tạo bảng transactions)
pending_orders_cache: Dict[str, Dict[str, Any]] = {}

def create_order(
    user_id: str,
    plan_type: str,
    amount: int,
    credits_added: int,
    order_code: str,
    jwt_token: Optional[str] = None
) -> Optional[str]:
    """
    Tạo đơn hàng thanh toán trong bảng transactions và lưu vào cache dự phòng.
    """
    # Lưu vào bộ nhớ đệm
    pending_orders_cache[order_code] = {
        "user_id": user_id,
        "order_code": order_code,
        "plan_type": plan_type,
        "amount": amount,
        "credits_added": credits_added,
        "status": "pending"
    }

    supabase = get_supabase_client(jwt_token=jwt_token)
    if not supabase:
        return order_code

    try:
        data_payload = {
            "user_id": user_id,
            "order_code": order_code,
            "plan_type": plan_type,
            "amount": amount,
            "credits_added": credits_added,
            "status": "pending"
        }
        res = supabase.table("transactions").insert(data_payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0].get("id")
        return order_code
    except Exception as e:
        print(f"Lưu ý: Bảng transactions chưa được tạo trong Supabase ({e}). Đơn hàng đã được lưu an toàn vào cache tạm.")
        return order_code

def activate_order(order_code: str, user_id: str, jwt_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Xác nhận nạp lượt hoặc nâng cấp gói Pro.
    Ưu tiên gọi RPC 'activate_order_plan'. Nếu chưa có RPC thì dùng fallback bảng hoặc cache.
    """
    supabase = get_supabase_client(jwt_token=jwt_token)

    # 1. Thử RPC Supabase
    if supabase:
        try:
            rpc_res = supabase.rpc("activate_order_plan", {"p_order_code": order_code, "p_user_id": user_id}).execute()
            if rpc_res and rpc_res.data:
                return rpc_res.data
        except Exception:
            pass

    # 2. Thử truy vấn bảng transactions
    order_data = None
    if supabase:
        try:
            order_res = supabase.table("transactions").select("*").eq("order_code", order_code).eq("user_id", user_id).execute()
            if order_res.data and len(order_res.data) > 0:
                order_data = order_res.data[0]
                supabase.table("transactions").update({"status": "completed"}).eq("id", order_data["id"]).execute()
        except Exception:
            pass

    # 3. Nếu chưa có trên bảng Supabase, kiểm tra trong cache tạm
    if not order_data:
        cached = pending_orders_cache.get(order_code)
        if cached and cached.get("user_id") == user_id:
            order_data = cached
            cached["status"] = "completed"

    if not order_data:
        return {"success": False, "reason": "order_not_found"}

    plan_type = order_data.get("plan_type")
    credits_added = order_data.get("credits_added", 0)

    # Cập nhật thông tin profile của người dùng
    if plan_type == "pro_monthly_99k":
        if supabase:
            try:
                supabase.table("profiles").update({"subscription_tier": "pro", "daily_credits": 9999}).eq("id", user_id).execute()
            except Exception:
                pass
        return {"success": True, "credits": 9999, "tier": "pro"}
    else:
        new_credits = 5
        if supabase:
            try:
                prof = get_user_profile(user_id, jwt_token)
                curr = prof.get("daily_credits") or 0
                new_credits = curr + credits_added
                supabase.table("profiles").update({"daily_credits": new_credits}).eq("id", user_id).execute()
            except Exception:
                pass
        return {"success": True, "credits": new_credits, "tier": "free"}


