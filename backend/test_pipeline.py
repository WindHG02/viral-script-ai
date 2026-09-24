"""
Script kiểm thử độc lập cho pipeline xử lý âm thanh và AI giải phẫu kịch bản
Được chuẩn hóa theo tiêu chuẩn MLOps: Có Pre-flight check kiểm tra API keys trước khi chạy.
"""
import sys

# Đảm bảo terminal Windows in được tiếng Việt có dấu chuẩn UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import json
from pathlib import Path

# Thêm đường dẫn backend vào sys.path để import app.core và app.services
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from app.core.config import settings
from app.services.audio import extract_audio_from_url, cleanup_audio_file
from app.services.groq_stt import transcribe_audio_groq
from app.services.gemini import analyze_viral_script, remix_viral_script

def run_preflight_checks() -> bool:
    """
    Kiểm tra tình trạng cấu hình biến môi trường trước khi thực thi.
    Giúp phát hiện ngay lỗi thiếu khóa API hoặc chưa thay chữ mẫu (placeholder).
    """
    key_status = settings.validate_keys()
    has_error = False

    print("=" * 65)
    print("🔍 BẮT ĐẦU KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT (PRE-FLIGHT CHECK)")
    print("=" * 65)

    if not key_status.get("GROQ_API_KEY"):
        print("❌ [LỖI] GROQ_API_KEY chưa hợp lệ!")
        print("   -> Nguyên nhân: Bạn chưa dán khóa thật hoặc file .env vẫn còn chữ mẫu 'gsk_your-groq-key-here'.")
        print("   -> Cách khắc phục: Vào https://console.groq.com/keys tạo key và dán vào file backend/.env")
        has_error = True
    else:
        print("✅ GROQ_API_KEY: Đã cấu hình chuẩn xác.")

    if not key_status.get("GEMINI_API_KEY"):
        print("❌ [LỖI] GEMINI_API_KEY chưa hợp lệ!")
        print("   -> Nguyên nhân: Bạn chưa dán khóa thật hoặc file .env vẫn còn chữ mẫu 'AIzaSy...your-gemini-key-here'.")
        print("   -> Cách khắc phục: Vào https://aistudio.google.com lấy key và dán vào file backend/.env")
        has_error = True
    else:
        print("✅ GEMINI_API_KEY: Đã cấu hình chuẩn xác.")

    print("=" * 65)
    return not has_error

def run_test(target_url: str):
    print(f"\n🚀 BẮT ĐẦU KIỂM THỬ PIPELINE VỚI VIDEO:")
    print(f"🔗 URL: {target_url}\n")
    
    # 1. Tải và bóc tách audio
    print("[1/3] Đang kéo luồng âm thanh và chuyển đổi sang 16kHz WAV...")
    audio_info = extract_audio_from_url(target_url)
    wav_path = audio_info["file_path"]
    print(f"✅ Đã tạo file WAV: {wav_path}")
    print(f"   - Tiêu đề: {audio_info['title']}")
    print(f"   - Thời lượng: {audio_info['duration_seconds']} giây")
    print(f"   - Nền tảng: {audio_info['platform']}")
    
    try:
        # 2. Bóc băng giọng nói
        print("\n[2/3] Đang gửi âm thanh sang Groq Whisper-large-v3 nhận diện giọng nói...")
        stt_result = transcribe_audio_groq(wav_path)
        print(f"✅ Nhận diện thành công ({len(stt_result['segments'])} câu thoại):")
        print(f"   \"{stt_result['full_text'][:250]}...\"\n")
        
        # 3. Gemini giải phẫu tâm lý
        print("[3/3] Đang gửi lời thoại sang Gemini 2.5 Flash giải phẫu Hook, Body, CTA...")
        analysis = analyze_viral_script(stt_result["full_text"], stt_result["segments"])
        print("\n🎉 KẾT QUẢ GIẢI PHẪU KỊCH BẢN (JSON):")
        print(json.dumps(analysis, ensure_ascii=False, indent=2))
        
        # 4. Thử nghiệm viết lại kịch bản mới
        test_niche = "Bán ốp lưng và phụ kiện iPhone chống sốc"
        print(f"\n[Bonus] Tái cấu trúc 3 kịch bản mới theo ngành: '{test_niche}'...")
        remixed = remix_viral_script(analysis, test_niche)
        print("\n🎉 KỊCH BẢN TÁI CẤU TRÚC:")
        print(json.dumps(remixed, ensure_ascii=False, indent=2))
        
    finally:
        # Luôn đảm bảo dọn sạch file tạm
        cleanup_audio_file(wav_path)
        print("\n🧹 Đã dọn dẹp xóa sạch file âm thanh tạm trên máy chủ.")
        print("✨ Hoàn tất toàn bộ quy trình kiểm thử!")

if __name__ == "__main__":
    # 1. Chạy kiểm tra khóa API trước
    if not run_preflight_checks():
        print("\n⚠️ Vui lòng mở file 'backend/.env', dán các khóa API thật vào rồi chạy lại lệnh này.")
        sys.exit(1)

    # 2. Xác định link kiểm thử: Ưu tiên link truyền từ tham số dòng lệnh
    default_url = "https://www.youtube.com/shorts/ApV9ldrQbnQ"
    if len(sys.argv) > 1 and sys.argv[1].strip():
        chosen_url = sys.argv[1].strip()
    else:
        chosen_url = default_url

    run_test(chosen_url)
