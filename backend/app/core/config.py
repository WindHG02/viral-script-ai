import os
from pathlib import Path
from dotenv import load_dotenv

# Tìm và nạp file .env từ thư mục backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip()
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    
    TEMP_STORAGE_DIR: Path = BASE_DIR / os.getenv("TEMP_STORAGE_DIR", "storage/temp")
    MAX_VIDEO_DURATION_SECONDS: int = int(os.getenv("MAX_VIDEO_DURATION_SECONDS", 180))

    def validate_keys(self) -> dict:
        """
        Kiểm tra tính hợp lệ của các khóa API trước khi chạy hệ thống.
        Phát hiện ngay nếu khóa còn đang là chữ mẫu (placeholder) hoặc bị bỏ trống.
        """
        status = {}
        # Kiểm tra Groq
        if not self.GROQ_API_KEY or "your-groq-key" in self.GROQ_API_KEY or self.GROQ_API_KEY.startswith("gsk_your"):
            status["GROQ_API_KEY"] = False
        else:
            status["GROQ_API_KEY"] = True

        # Kiểm tra Gemini
        if not self.GEMINI_API_KEY or "your-gemini-key" in self.GEMINI_API_KEY or "your-key" in self.GEMINI_API_KEY:
            status["GEMINI_API_KEY"] = False
        else:
            status["GEMINI_API_KEY"] = True

        # Kiểm tra Supabase
        if not self.SUPABASE_URL or "your-project" in self.SUPABASE_URL:
            status["SUPABASE_URL"] = False
        else:
            status["SUPABASE_URL"] = True

        if not self.SUPABASE_KEY or "your-anon-key" in self.SUPABASE_KEY:
            status["SUPABASE_KEY"] = False
        else:
            status["SUPABASE_KEY"] = True

        return status

settings = Settings()

# Đảm bảo thư mục lưu trữ tạm luôn tồn tại
os.makedirs(settings.TEMP_STORAGE_DIR, exist_ok=True)
