# VIRAL SCRIPT AI - CÔNG CỤ GIẢI PHÃU & TÁI CẤU TRÚC KỊCH BẢN VIDEO TRIỆU VIEW

ViralScript AI là nền tảng AI giúp người sáng tạo nội dung (Content Creator), nhà bán hàng TikTok Shop và Marketer "nhân bản" các công thức video ngắn triệu view. Thay vì ngồi bí ý tưởng cả ngày, hệ thống bóc tách toàn bộ nhịp điệu tâm lý của video mẫu và xuất ra 3 kịch bản mới toanh theo ngành hàng của bạn trong vòng 15 giây.

Dự án tích hợp đầy đủ quy trình từ giải phẫu kịch bản, sinh phân cảnh Storyboard cho công cụ AI render video (Midjourney, Runway, Pippit), đến máy nhắc chữ Teleprompter hỗ trợ người dùng bật máy quay ngay trên màn hình.

---

## BẢNG TỔNG HỢP NĂNG LỰC DỰ ÁN (BAREM TÍNH NĂNG ĐÃ HOÀN THIỆN)

### 1. Phân Tích & Giải Phẫu Tâm Lý Video Viral
- **Kéo luồng âm thanh đa nền tảng:** Nhận diện và tải ngầm âm thanh từ TikTok, YouTube Shorts, Facebook Reels và Instagram Reels qua `yt-dlp`. Chuẩn hóa tự động về file WAV 16.000 Hz kênh đơn (Mono) bằng FFmpeg.
- **Bóc băng siêu tốc dưới 1.5 giây:** Sử dụng mô hình `whisper-large-v3` trên hạ tầng đám mây Groq Cloud. Tách lời thoại kèm mốc thời gian bắt đầu và kết thúc của từng câu chính xác từng mili-giây.
- **Giải phẫu cấu trúc 3 giai đoạn:** 
  - *Hook (3-5 giây đầu):* Bóc tách loại mồi câu (Gây sốc, Đánh vào nỗi sợ, Bắt bẻ sai lầm, Đặt câu hỏi tò mò) và giải thích lý do khiến ngón tay người xem phải dừng lại.
  - *Body (Đoạn thân):* Nhận diện các kỹ thuật ngắt nhịp (Pattern Interrupt), đòn bẩy kịch tính và bài học cốt lõi.
  - *CTA (Đoạn chốt):* Đánh giá hiệu quả của lời kêu gọi hành động (Thả tim, Lưu video, Bình luận tranh cãi hay Bấm vào giỏ hàng).

### 2. Tái Cấu Trúc Kịch Bản (Script Remix) & Phân Cảnh Storyboard
- **Chuyển hóa ngành hàng:** Giữ nguyên cấu trúc tâm lý giữ chân của video triệu view gốc nhưng thay thế 100% nội dung sang ngành hàng người dùng yêu cầu (Mỹ phẩm, Bất động sản, Gia dụng, Khóa học, F&B...).
- **4 Persona sáng tạo linh hoạt:**
  - *UGC Reviewer:* Mộc mạc, gần gũi, mở đầu bằng trải nghiệm cá nhân thật.
  - *Chuyên gia phản biện:* Sắc sảo, đanh thép, đưa số liệu lật tẩy các hiểu lầm phổ biến.
  - *Storyteller kịch tính:* Kể chuyện hồi hộp, tạo nút thắt bất ngờ.
  - *Hài hước giễu nhại:* Bắt trend, châm biếm các tình huống éo le đời thường.
- **Bảng phân cảnh Storyboard chuẩn Pippit AI:** Chia kịch bản thành từng cảnh cụ thể (Scene 1 đến 4). Mỗi cảnh gồm mốc thời gian, chỉ dẫn góc máy/diễn xuất, câu chữ giật tít chạy trên màn hình (Text Overlay) và prompt tiếng Anh chi tiết để đưa vào các công cụ sinh video AI (Midjourney, Runway, Pippit, Kling).

### 3. Phòng Thu Máy Nhắc Chữ (Studio Teleprompter)
- **Cuộn chữ mượt mà:** Sử dụng vòng lặp `requestAnimationFrame` giúp văn bản chạy cuộn tự nhiên theo tốc độ đọc của người dùng mà không bị giật lag.
- **Chế độ quay chuyên nghiệp:** Hỗ trợ lật gương chữ (Mirror Flip) để gắn điện thoại vào các giá đỡ máy quay có gương phản chiếu.
- **Tùy biến trực quan:** Tăng giảm kích thước chữ, điều chỉnh tốc độ cuộn chữ (1x đến 5x), hỗ trợ đếm ngược 3 giây trước khi bắt đầu đọc.

### 4. Thư Viện Mẫu & Giao Diện Khám Phá Ngành Hàng
- **Khu vực khám phá theo ngành hàng:** Hiển thị trực quan các công thức video có lượng view cao nhất theo từng lĩnh vực (Bán hàng UGC, Công nghệ, Drama, Tài chính) kèm nút bấm thử nghiệm 1-click.
- **Thư viện kịch bản mẫu (Templates Modal):** Kho các cấu trúc video kinh điển đã được chứng minh hiệu quả giữ chân. Người dùng có thể sao chép nhanh hoặc nạp thẳng vào phân tích mà không cần chuẩn bị link video từ trước.
- **Thanh điều hướng thông minh:** Bấm vào Logo để reset toàn bộ trạng thái về trang chủ ban đầu trong 1 giây.
- **Khung tiện ích tài khoản (User Dropdown):** Quản lý thông tin cá nhân, chuyển đổi chế độ giao diện Sáng/Tối, kiểm tra trạng thái lượt dùng, gửi góp ý phản hồi và đăng xuất an toàn.

### 5. Hạ Tầng Kỹ Thuật & Khả Năng Chịu Tải
- **Cơ chế nhảy tầng Gemini Cascade:** Hệ thống 6 tầng tự động luân chuyển model (`gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-flash-latest`). Khi một model chạm hạn mức ngày (lỗi 429) hoặc quá tải (lỗi 503), hệ thống lập tức nhảy sang model kế tiếp mà không làm gián đoạn trải nghiệm người dùng.
- **Cầu nối kép chống lỗi CORS:** Tích hợp Next.js Rewrite Proxy (`/pyapi/* -> backend:8000`) đi kèm `apiFetch` tự động fallback. Chặn đứng hoàn toàn lỗi phân giải IPv6 localhost và lỗi chặn CORS trên các trình duyệt hiện đại.
- **Tối ưu Windows Console:** Cấu hình chuẩn bảng mã UTF-8 với cờ an toàn, triệt tiêu lỗi sập tiến trình `UnicodeEncodeError` khi in tiếng Việt và ký tự đặc biệt.

### 6. Quản Lý Hạn Mức & Cổng Thanh Toán VNPAY
- **Kiểm soát lượt dùng nghiêm ngặt:** Khách vãng lai được trải nghiệm 2 lượt miễn phí. Tài khoản đăng ký nhận 3 lượt mỗi ngày. Tài khoản Pro VIP không giới hạn lượt.
- **Cổng giao dịch VNPAY:** Tích hợp quy trình tạo đơn hàng tự động, hiển thị thông tin chuyển khoản kèm mã QR và nội dung định danh `VS [MÃ_ĐƠN]`. Kích hoạt tài khoản tức thì sau khi xác nhận chuyển khoản.

---

## KIẾN TRÚC HỆ THỐNG (TECH STACK)

| Thành phần | Công nghệ sử dụng | Vai trò trong hệ thống |
| :--- | :--- | :--- |
| **Giao diện (Frontend)** | Next.js 14, React 18, Tailwind CSS, Lucide Icons | Xây dựng giao diện Web App, tương tác video, bảng phân cảnh và máy nhắc chữ |
| **Máy chủ (Backend)** | FastAPI, Uvicorn, Python 3.11+ | Xử lý các luồng API, bóc tách âm thanh, điều phối AI và quản lý giao dịch |
| **Xử lý âm thanh** | yt-dlp, FFmpeg, imageio-ffmpeg | Tải ngầm video ngắn và chuyển đổi định dạng âm thanh 16kHz WAV Mono |
| **Nhận diện giọng nói** | Groq Cloud, Whisper-large-v3 | Chuyển đổi giọng nói thành văn bản kèm mốc thời gian chi tiết trong 1.5s |
| **Mô hình ngôn ngữ** | Google Gemini (Cascade 6 tầng) | Giải phẫu cấu trúc tâm lý kịch bản và sinh bảng phân cảnh Storyboard |
| **Cơ sở dữ liệu & Auth** | Supabase, PostgreSQL, Row Level Security (RLS) | Lưu trữ thông tin người dùng, lịch sử phân tích kịch bản và đơn hàng |

---

## CẤU TRÚC THƯ MỤC DỰ ÁN

```text
viral_script_ai/
├── backend/                              # Máy chủ xử lý dữ liệu và AI (FastAPI)
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py                 # Cấu hình biến môi trường và hằng số
│   │   ├── services/
│   │   │   ├── audio.py                  # Kéo âm thanh từ video và dọn rác bộ nhớ đệm
│   │   │   ├── groq_stt.py               # Nhận diện lời thoại qua Groq Whisper
│   │   │   ├── gemini.py                 # Gemini Cascade giải phẫu và tạo Storyboard
│   │   │   └── db.py                     # Kết nối cơ sở dữ liệu Supabase và trừ lượt
│   │   └── main.py                       # Các endpoint API chính (/analyze, /remix, /payment)
│   ├── storage/temp/                     # Thư mục lưu file âm thanh tạm thời
│   ├── .env                              # Khai báo các khóa bí mật của hệ thống
│   ├── requirements.txt                  # Danh sách thư viện Python
│   └── test_pipeline.py                  # Script kiểm thử độc lập luồng AI trong terminal
│
├── frontend/                             # Giao diện người dùng (Next.js 14 App Router)
│   ├── app/
│   │   ├── layout.tsx                    # Bố cục chuẩn của ứng dụng
│   │   ├── page.tsx                      # Trang chủ tích hợp toàn bộ luồng xử lý
│   │   └── globals.css                   # Định kiểu giao diện Tailwind CSS
│   ├── components/
│   │   ├── Navbar.tsx                    # Thanh điều hướng, nút Home reset & User dropdown
│   │   ├── VideoPlayer.tsx               # Khung trình chiếu video đồng bộ mốc thời gian
│   │   ├── ScriptBreakdown.tsx           # Bảng giải phẫu tâm lý Hook, Body, CTA
│   │   ├── RemixModal.tsx                # Hộp thoại tạo kịch bản mới & xem Storyboard
│   │   ├── TeleprompterModal.tsx         # Máy nhắc chữ Studio cuộn chữ toàn màn hình
│   │   ├── PippitShowcase.tsx            # Khu vực giới thiệu tính năng & khám phá ngành hàng
│   │   ├── TemplatesModal.tsx            # Thư viện mẫu kịch bản triệu view thực chiến
│   │   ├── AuthModal.tsx                 # Hộp thoại đăng nhập / đăng ký Supabase
│   │   ├── HistoryModal.tsx              # Hộp thoại xem lại các kịch bản đã phân tích
│   │   └── PaywallModal.tsx              # Bảng giá nạp lượt chuyển khoản ví VNPAY
│   ├── lib/
│   │   ├── api.ts                        # Bộ gọi API thích ứng chống lỗi CORS
│   │   └── supabaseClient.ts             # Khởi tạo kết nối Supabase phía Client
│   ├── next.config.mjs                   # Cấu hình Next.js và Proxy Rewrite (/pyapi)
│   └── package.json                      # Danh sách các gói thư viện Node.js
│
├── docs/                                 # Tài liệu kỹ thuật dự án
│   ├── supabase_schema.sql               # Script SQL tạo bảng và bảo mật RLS
│   └── system_architecture.md            # Tài liệu kiến trúc phân tầng
│
├── HUONG_DAN_VAN_HANH_CHI_TIET.md        # Cẩm nang vận hành và kịch bản thuyết trình
└── README.md                             # Tài liệu giới thiệu tổng quan dự án
```

---

## HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Chuẩn bị môi trường
- Đã cài đặt **Python 3.10+** và **Node.js 18+**.
- Công cụ **FFmpeg** đã có trong biến môi trường hệ thống (hoặc tự động nạp qua `imageio-ffmpeg`).

### 2. Cấu hình khóa bí mật
Tạo file `backend/.env` với nội dung sau:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
```

### 3. Cài đặt và khởi chạy Backend (Cổng 8000)
Mở một cửa sổ Terminal tại thư mục `backend/`:
```bash
# Cài đặt các thư viện Python
pip install -r requirements.txt

# Khởi chạy máy chủ FastAPI trên tất cả các dải IP
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Kiểm tra máy chủ hoạt động tại: `http://localhost:8000` (Tài liệu API Swagger: `http://localhost:8000/docs`).

### 4. Cài đặt và khởi chạy Frontend (Cổng 3000)
Mở một cửa sổ Terminal khác tại thư mục `frontend/`:
```bash
# Cài đặt các gói thư viện Node.js
npm install

# Khởi chạy giao diện phát triển Next.js
npm run dev
```
Mở trình duyệt truy cập ứng dụng tại: `http://localhost:3000`.

---

## QUY TRÌNH KIỂM THỬ (TEST CASES CHÍNH)

1. **Kiểm thử bóc tách video:** Dán một đường link video ngắn YouTube Shorts hoặc TikTok vào ô tìm kiếm -> Nhấn **Phân Tích Script** -> Hệ thống hiển thị video player bên trái và bảng giải phẫu Hook 3s, Body, CTA bên phải.
2. **Kiểm thử tạo kịch bản & Storyboard:** Nhấn nút **Tái Cấu Trúc Kịch Bản** -> Chọn ngành hàng (ví dụ: Mỹ phẩm) và phong cách Persona (ví dụ: UGC) -> Hệ thống trả về 3 phiên bản kịch bản kèm bảng phân cảnh Storyboard (Góc máy, B-roll prompt tiếng Anh, Text Overlay).
3. **Kiểm thử máy nhắc chữ:** Trên màn hình kịch bản viết lại, bấm **Bật Máy Nhắc Chữ** -> Giao diện Teleprompter mở toàn màn hình, chữ bắt đầu tự động cuộn mượt mà -> Thử các tính năng lật gương, chỉnh cỡ chữ và đổi tốc độ đọc.
4. **Kiểm thử nút Home reset:** Bấm vào chữ **ViralScript AI** trên thanh điều hướng -> Mọi dữ liệu phân tích được thu hồi, trang quay về trạng thái giới thiệu ban đầu.
5. **Kiểm thử Menu cá nhân:** Bấm vào avatar tên người dùng -> Menu tiện ích mở ra -> Thử các mục Upgrade, Status, Feedback và Log out.
