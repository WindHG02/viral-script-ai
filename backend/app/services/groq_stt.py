import os
from pathlib import Path
from groq import Groq, AuthenticationError
from typing import Dict, Any, List
from app.core.config import settings

def transcribe_audio_groq(audio_path: str) -> Dict[str, Any]:
    """
    Gửi file âm thanh WAV lên Groq Cloud chạy mô hình Whisper-large-v3.
    Bóc tách lời thoại kèm mốc thời gian (start, end) của từng câu theo chuẩn quốc tế.
    """
    if not settings.GROQ_API_KEY or "your-groq-key" in settings.GROQ_API_KEY:
        raise ValueError(
            "Chưa cấu hình GROQ_API_KEY hợp lệ trong file .env! "
            "Hiện tại khóa vẫn đang là chữ mẫu mặc định. "
            "Vui lòng lấy khóa thật tại: https://console.groq.com/keys và dán vào file .env"
        )

    client = Groq(api_key=settings.GROQ_API_KEY)
    file_name = Path(audio_path).name

    try:
        with open(audio_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(file_name, file.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
                temperature=0.0
            )

        full_text = getattr(transcription, "text", "")
        raw_segments = getattr(transcription, "segments", [])

        parsed_segments: List[Dict[str, Any]] = []
        for seg in raw_segments:
            parsed_segments.append({
                "id": seg.get("id"),
                "start": round(float(seg.get("start", 0.0)), 2),
                "end": round(float(seg.get("end", 0.0)), 2),
                "text": seg.get("text", "").strip()
            })

        return {
            "status": "success",
            "full_text": full_text.strip(),
            "segments": parsed_segments
        }

    except AuthenticationError:
        raise RuntimeError(
            "Khóa GROQ_API_KEY không hợp lệ hoặc đã hết hạn (Mã lỗi 401). "
            "Hãy kiểm tra lại file backend/.env và chắc chắn bạn đã copy đúng chuỗi ký tự bắt đầu bằng 'gsk_'."
        )
    except Exception as e:
        raise RuntimeError(f"Lỗi khi nhận diện giọng nói qua Groq Whisper: {str(e)}")
