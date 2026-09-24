# KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE) - VIRAL SCRIPT AI

Tài liệu này đặc tả toàn bộ kiến trúc kỹ thuật của hệ thống Giải Phẫu & Tái Cấu Trúc Kịch Bản Video Triệu View.

```mermaid
flowchart TD
    subgraph CLIENT["1. TẦNG GIAO DIỆN (CLIENT LAYER - Next.js)"]
        UI["Giao diện người dùng (React, Tailwind CSS)"]
        INPUT["Ô dán Link Video & Chọn Ngành Hàng"]
        PLAYER["Trình phát Video đồng bộ mốc thời gian (Timestamp Player)"]
        EDITOR["Trình biên tập & Xuất kịch bản (Script Editor)"]
    end

    subgraph GATEWAY["2. CỔNG ĐIỀU PHỐI (GATEWAY & SECURITY)"]
        NGINX["Nginx Reverse Proxy"]
        RATELIMIT["Rate Limiter (Giới hạn 3 lượt miễn phí/ngày)"]
        AUTH["Xác thực tài khoản (Supabase Auth / Google OAuth)"]
    end

    subgraph BACKEND["3. TẦNG XỬ LÝ TRUNG TÂM (FASTAPI APPLICATION)"]
        API_MAIN["FastAPI Core App"]
        ROUTER["API Router (/analyze, /remix, /export)"]
        CACHE_CHECK["Bộ kiểm tra trùng lặp (URL Cache Checker)"]
        TASK_RUNNER["Trình xử lý tác vụ bất đồng bộ (Async Worker)"]
    end

    subgraph INGESTION["4. BÓC TÁCH VÀ XỬ LÝ ÂM THANH"]
        YTDLP["yt-dlp Engine (Bóc tách luồng âm thanh)"]
        FFMPEG["FFmpeg (Nén & Cắt audio chuẩn 16kHz Mono)"]
        TEMP_STORE[("Bộ nhớ tạm Local Disk / RAM")]
    end

    subgraph AI_LAYER["5. TẦNG MÔ HÌNH TRÍ TUỆ NHÂN TẠO (AI ENGINES)"]
        GROQ["Groq Cloud API (Whisper-large-v3 Speech-to-Text)"]
        GEMINI["Google Gemini 2.5 Flash API"]
        PROMPT_ANALYZE["System Prompt: Giải phẫu Hook, Body, CTA"]
        PROMPT_REMIX["System Prompt: Tái cấu trúc kịch bản theo ngành"]
    end

    subgraph DATA_LAYER["6. TẦNG LƯU TRỮ VÀ DỮ LIỆU (DATABASE & CACHE)"]
        PG["PostgreSQL / Supabase (Bảng Users, Scripts, Transcripts)"]
        REDIS["Redis Cache (Lưu URL đã bóc tách & Token phiên)"]
    end

    %% Luồng truyền dữ liệu
    INPUT -->|Gửi URL video| NGINX
    NGINX --> RATELIMIT --> AUTH --> API_MAIN
    API_MAIN --> ROUTER
    ROUTER --> CACHE_CHECK

    CACHE_CHECK -->|Trúng Cache: Đã phân tích| REDIS
    REDIS -.->|Trả kết quả 0.2 giây| ROUTER

    CACHE_CHECK -->|Chưa có: Xử lý mới| TASK_RUNNER
    TASK_RUNNER --> YTDLP
    YTDLP --> FFMPEG --> TEMP_STORE

    TEMP_STORE -->|Gửi file âm thanh sạch| GROQ
    GROQ -->|Trả văn bản kèm Timestamps| TASK_RUNNER

    TASK_RUNNER --> PROMPT_ANALYZE --> GEMINI
    GEMINI -->|Trả JSON phân tích kịch bản| TASK_RUNNER

    TASK_RUNNER -->|Lưu lịch sử lâu dài| PG
    TASK_RUNNER -->|Lưu Cache nhanh 7 ngày| REDIS
    TASK_RUNNER -->|Xóa file âm thanh tạm| TEMP_STORE

    ROUTER -->|Trả dữ liệu JSON| UI
    UI --> PLAYER
    UI --> EDITOR

    EDITOR -->|Yêu cầu viết kịch bản mới| API_MAIN
    API_MAIN --> PROMPT_REMIX --> GEMINI
    GEMINI -->|Trả kịch bản phái sinh| EDITOR
```

---

## BÓC TÁCH CÁC THÀNH PHẦN

1. **Frontend (Next.js 14)**: Trình phát `react-player` kết nối thời gian thực với mốc thời gian câu thoại (Click-to-Sync).
2. **Audio Ingestion (`yt-dlp` + `ffmpeg`)**: Chỉ trích xuất stream âm thanh, chuyển đổi sang chuẩn 16.000 Hz Mono, tự động xóa file tạm sau khi nhận diện xong.
3. **Speech-to-Text (Groq Whisper-large-v3)**: Tốc độ xử lý 1-2 giây cho video 60 giây, trả về mảng segments với thời điểm bắt đầu và kết thúc của từng câu.
4. **LLM Engine (Gemini 2.5 Flash)**: Nhận lời thoại có mốc thời gian, bóc tách cấu trúc tâm lý Hook, Body, CTA theo JSON Schema nghiêm ngặt.
5. **Database & Auth (Supabase PostgreSQL)**: Bảo mật khóa dòng RLS, mã hóa mật khẩu bcrypt, hỗ trợ Google OAuth 2.0.
