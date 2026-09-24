import os
import re
import sys
import uuid
import shutil
import yt_dlp
from pathlib import Path
from typing import Dict, Any
from app.core.config import settings

def get_ffmpeg_path() -> str:
    """
    Tự động tìm kiếm đường dẫn FFmpeg:
    1. Kiểm tra FFmpeg có sẵn trong biến môi trường PATH của hệ điều hành không.
    2. Nếu không có, tự động dùng FFmpeg nhúng sẵn từ thư viện imageio_ffmpeg.
    """
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"

def sanitize_url(raw_url: str) -> str:
    """
    Cắt bỏ các tham số rác đằng sau URL (như ?is_from_webapp=1, tracking tokens...)
    để URL trở về dạng chuẩn, tránh lỗi tải và giúp cơ chế Cache nhận diện chính xác.
    """
    cleaned = raw_url.strip()
    cleaned = cleaned.split("?")[0]
    return cleaned

def extract_audio_from_url(video_url: str) -> Dict[str, Any]:
    """
    Kéo luồng âm thanh ngầm từ link video (TikTok, YouTube Shorts, Reels),
    nén thành file WAV chuẩn 16.000 Hz, kênh đơn (Mono) sẵn sàng ném cho mô hình Whisper.
    """
    clean_url = sanitize_url(video_url)
    session_id = str(uuid.uuid4())[:8]
    output_filename = f"audio_{session_id}"
    output_template = str(settings.TEMP_STORAGE_DIR / f"{output_filename}.%(ext)s")
    final_wav_path = settings.TEMP_STORAGE_DIR / f"{output_filename}.wav"

    ffmpeg_bin = get_ffmpeg_path()

    # Cấu hình yt-dlp tối ưu cho bóc tách âm thanh siêu nhẹ
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'ffmpeg_location': ffmpeg_bin,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
        }],
        # Format dict với key tên postprocessor — bắt buộc từ yt_dlp >= 2023.03.x
        # Dùng flat list sẽ bị bỏ qua silently → WAV ra full sample rate, Whisper chạy chậm
        'postprocessor_args': {
            'FFmpegExtractAudio': ['-ar', '16000', '-ac', '1']
        },
        'socket_timeout': 20,
        'retries': 3,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(clean_url, download=True)
            duration = info.get('duration', 0)
            title = info.get('title', 'Unknown Title')
            platform = info.get('extractor', 'unknown')

            # Kiểm tra chặn video quá dài (chỉ xử lý video ngắn dưới hạn mức)
            if duration and duration > settings.MAX_VIDEO_DURATION_SECONDS:
                cleanup_audio_file(str(final_wav_path))
                raise ValueError(f"Video dài {duration}s, vượt quá giới hạn tối đa {settings.MAX_VIDEO_DURATION_SECONDS}s.")

            # Đảm bảo file WAV đã được tạo thành công sau postprocess
            if not final_wav_path.exists():
                raise RuntimeError("Không tìm thấy file âm thanh sau khi xử lý. Vui lòng thử lại với đường link khác.")

            return {
                "status": "success",
                "file_path": str(final_wav_path),
                "duration_seconds": duration,
                "title": title,
                "platform": platform,
                "clean_url": clean_url
            }

    except yt_dlp.utils.DownloadError as e:
        cleanup_audio_file(str(final_wav_path))
        raise RuntimeError(f"Không thể tải video. Link có thể bị xóa, để chế độ riêng tư hoặc bị chặn: {str(e)}")
    except Exception as e:
        cleanup_audio_file(str(final_wav_path))
        raise RuntimeError(f"Lỗi khi xử lý âm thanh: {str(e)}")

def cleanup_audio_file(file_path: str):
    """
    Xóa file âm thanh tạm thời trên ổ cứng ngay sau khi bóc băng xong,
    đảm bảo ổ đĩa máy chủ luôn trống rỗng và bảo mật dữ liệu.
    """
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass
