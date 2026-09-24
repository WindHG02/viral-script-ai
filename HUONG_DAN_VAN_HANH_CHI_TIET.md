# HƯỚNG DẪN VẬN HÀNH VÀ TỔNG HỢP KỸ THUẬT ĐỒ ÁN VIRALSCRIPT AI

Tài liệu này tổng hợp toàn bộ các phân hệ đã hoàn thiện của hệ thống ViralScript AI cùng các bước khởi động và kịch bản kiểm thử chi tiết.

---

## 1. TỔNG QUAN HỆ THỐNG

ViralScript AI là nền tảng phân tích cấu trúc tâm lý của các video ngắn triệu view (TikTok, YouTube Shorts, Reels) và chuyển đổi công thức giữ chân người xem sang các kịch bản mới cho từng ngành hàng cụ thể.

Hệ thống được thiết kế theo kiến trúc tách biệt (Decoupled Architecture):
- Backend: FastAPI (Python 3.13) đảm nhiệm toàn bộ tác vụ xử lý âm thanh, nhận diện giọng nói và gọi mô hình AI.
- Frontend: Next.js 14 (TypeScript, Tailwind CSS) xây dựng giao diện tương tác thời gian thực cho người dùng.
- Cơ sở dữ liệu: Supabase (PostgreSQL) lưu trữ dữ liệu phân tích, tài khoản người dùng và quản lý hạn mức sử dụng.

```
[Link Video YouTube Shorts / TikTok]
               │
               ▼
   [Next.js 14 Frontend] (Kiểm tra Quota Guest / User)
               │
               ▼
   [FastAPI Backend Server]
   ├── 1. yt-dlp + ffmpeg: Tách luồng audio, nén WAV 16kHz mono
   ├── 2. Groq Cloud: Chạy Whisper-large-v3 lấy transcript có timestamp
   ├── 3. Gemini Cascade: Bóc tách Hook/Body/CTA & tạo 3 kịch bản Remix
   └── 4. Supabase DB: Trừ credit an toàn bằng SQL function & lưu trữ
```

---

## 2. CHI TIẾT CÁC TÍNH NĂNG VÀ CÔNG NGHỆ ĐÃ HOÀN THIỆN

### Phân hệ Backend (`backend/`)

1. **Bóc tách âm thanh siêu nhẹ (`app/services/audio.py`)**:
   - Sử dụng thư viện `yt-dlp` trích xuất thẳng luồng âm thanh từ URL mà không cần tải toàn bộ tệp video MP4, tiết kiệm tối đa tài nguyên mạng.
   - Tích hợp `ffmpeg` chuẩn hóa âm thanh về định dạng WAV, tần số lấy mẫu 16kHz, đơn kênh (mono). Tệp âm thanh sau khi nén có dung lượng nhỏ hơn 90% so với video gốc.

2. **Nhận diện giọng nói chuẩn xác (`app/services/groq_stt.py`)**:
   - Gửi tệp âm thanh lên dịch vụ Groq Cloud xử lý thông qua mô hình `whisper-large-v3`.
   - Thời gian nhận diện chỉ mất từ 1 đến 2 giây cho một video ngắn 60 giây.
   - Trả về danh sách từng câu thoại có gắn mốc thời gian chính xác tới từng phần trăm giây (`start`, `end`, `text`).

3. **Cơ chế chuyển cấp Gemini 6 tầng (`app/services/gemini.py`)**:
   - Giải quyết triệt để vấn đề tài khoản miễn phí chạm ngưỡng giới hạn 20 lượt/ngày (lỗi 429 Resource Exhausted) và lỗi máy chủ Google quá tải (lỗi 503 Unavailable).
   - Danh sách mô hình dự phòng hoạt động tuần tự:
     1. `gemini-3.6-flash` (ưu tiên cao nhất, phân tích sắc nét)
     2. `gemini-3.5-flash`
     3. `gemini-3.5-flash-lite`
     4. `gemini-3.1-flash-lite`
     5. `gemini-flash-lite-latest`
     6. `gemini-flash-latest`
   - Khi một mô hình gặp lỗi 429 hoặc 503, backend tự động nhảy sang mô hình tiếp theo mà không làm gián đoạn người dùng. Tổng hạn mức miễn phí mỗi ngày đạt trên 100 lượt.
   - Bóc tách cấu trúc tâm lý video thành 3 phần:
     - Hook (3 giây đầu): Phân loại câu mồi nhử, giải thích nguyên nhân giữ chân người xem.
     - Body: Kỹ thuật ngắt nhịp gây chú ý (Pattern Interrupt) và nội dung cốt lõi.
     - CTA: Đánh giá độ hiệu quả của câu kêu gọi hành động cuối video.
   - Chức năng Remix: Nhận tên ngành hàng mới, áp dụng công thức nhịp điệu gốc để tạo ra 3 kịch bản hoàn chỉnh (Trực diện, Kể chuyện/Nỗi sợ, Hài hước/Định kiến).

4. **Quản trị cơ sở dữ liệu và bảo mật (`app/services/db.py`, `app/main.py`)**:
   - Cung cấp các API: `/api/analyze`, `/api/remix`, `/api/history`, `/api/user-credits`.
   - Trừ lượt an toàn thông qua hàm SQL `deduct_user_credit` chạy trực tiếp trong PostgreSQL, ngăn chặn tình trạng gian lận credit khi người dùng mở nhiều tab cùng lúc.

---

### Phân hệ Frontend (`frontend/`)

1. **Thanh điều hướng (`components/Navbar.tsx`)**:
   - Hiển thị logo, trạng thái đăng nhập, số credit còn lại trong ngày của người dùng kèm huy hiệu trạng thái.
   - Nút mở lịch sử phân tích và nút kích hoạt bảng nâng cấp tài khoản Pro.

2. **Bảng phân tích kịch bản (`components/ScriptBreakdown.tsx`)**:
   - Thiết kế giao diện Dark theme chia 3 khối màu trực quan: Đỏ/Vàng cho Hook, Xanh dương cho Body và Tím cho CTA.
   - Đi kèm danh sách lời thoại khớp từng giây của video gốc và các nút sao chép nội dung nhanh chóng.

3. **Xưởng tạo kịch bản & Storyboard (`components/RemixModal.tsx`)**:
   - Chọn phong cách diễn xuất (Creator Persona): UGC Reviewer, Chuyên gia bóc phốt, Kể chuyện drama, Hài hước bắt trend.
   - Trả về 3 kịch bản hoàn chỉnh và hỗ trợ chuyển đổi giữa chế độ đọc lời thoại thông thường và chế độ Bảng phân cảnh Storyboard chuyên nghiệp (chuẩn Pippit AI).
   - Mỗi cảnh Storyboard bao gồm: Lời thoại, chỉ dẫn góc máy & diễn xuất, chữ giật tít màn hình và câu prompt tiếng Anh chuẩn điện ảnh cho các công cụ AI Video (Pippit, Midjourney, Seedance, Runway).

4. **Chế độ Máy nhắc chữ chuyên nghiệp (`components/TeleprompterModal.tsx`)**:
   - Màn hình đen toàn cảnh độ tương phản cao, tự động cuộn chữ theo thời gian thực để người dùng vừa nhìn camera điện thoại vừa đọc thoại trơn tru.
   - Hỗ trợ phím tắt Space (bắt đầu/tạm dừng), phím Esc (thoát), thanh trượt điều chỉnh tốc độ cuộn, nút tăng giảm cỡ chữ và chế độ lật gương (Mirror Flip) dành cho kính nhắc chữ chuyên dụng.

5. **Xác thực người dùng (`components/AuthModal.tsx`)**:
   - Hỗ trợ đăng nhập một chạm qua Google OAuth và đăng nhập bằng Email/Mật khẩu thông qua Supabase Auth.
   - Đồng bộ thông tin người dùng vào bảng `profiles` trên Supabase ngay sau khi đăng nhập thành công.

6. **Cổng thanh toán nâng cấp (`components/PaywallModal.tsx`)**:
   - Hiển thị trực tiếp mã QR VNPAY chính chủ (chủ tài khoản Nguyễn Lê Bảo Phong, số điện thoại 0834490939).
   - Tự động sinh mã đơn hàng ngẫu nhiên dạng `VSxxxx`.
   - Tích hợp sẵn các nút sao chép nhanh số tài khoản, số tiền (49.000đ/tháng) và nội dung chuyển khoản.

7. **Lịch sử phân tích (`components/HistoryModal.tsx`)**:
   - Cho phép người dùng xem lại danh sách các video đã phân tích và các bản kịch bản remix trước đó.

---

### Cơ chế quản lý hạn mức sử dụng (Quota)

- **Khách vãng lai (Guest)**: Được sử dụng thử 2 lượt phân tích miễn phí. Hệ thống lưu mã định danh `guest_id` trong bộ nhớ cục bộ trình duyệt (localStorage). Khi dùng hết 2 lượt, màn hình phân tích sẽ khóa lại và hiện bảng yêu cầu đăng nhập.
- **Thành viên đăng nhập (Registered User)**: Được cấp 3 credit miễn phí mỗi ngày. Khi sử dụng hết số credit này, hệ thống sẽ mở bảng thanh toán quét mã QR VNPAY để nâng cấp.

---

## 3. HƯỚNG DẪN CÁCH KHỞI ĐỘNG HỆ THỐNG

### Yêu cầu môi trường
- Python 3.10 trở lên (máy đã cài sẵn Python 3.13).
- Node.js 18 trở lên và npm.
- FFMPEG đã được cài đặt và thiết lập biến môi trường PATH.

---

### Khởi động Backend (FastAPI)

1. Mở một cửa sổ PowerShell hoặc Terminal mới.
2. Di chuyển vào thư mục backend và khởi chạy server:

```powershell
cd d:\learn24h\viral_script_ai\backend
uvicorn app.main:app --reload --port 8000
```

Khi màn hình hiển thị:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```
Backend đã sẵn sàng nhận kết nối. Bạn có thể mở trình duyệt tại địa chỉ `http://localhost:8000/docs` để kiểm tra tài liệu Swagger UI của toàn bộ API.

---

### Khởi động Frontend (Next.js)

1. Mở một cửa sổ PowerShell hoặc Terminal thứ hai.
2. Di chuyển vào thư mục frontend và khởi chạy máy chủ phát triển:

```powershell
cd d:\learn24h\viral_script_ai\frontend
npm run dev
```

Khi màn hình xuất hiện thông báo:
```
- Local: http://localhost:3000
```
Mở trình duyệt và truy cập vào địa chỉ `http://localhost:3000` để bắt đầu sử dụng.

---

## 4. KỊCH BẢN KIỂM THỬ TỪNG TÍNH NĂNG (TEST FLOW)

Khi trình bày đồ án hoặc kiểm tra vận hành, bạn thực hiện lần lượt theo quy trình 6 bước dưới đây:

### Bước 1: Dùng thử ở vai trò Khách vãng lai
1. Mở trang chủ `http://localhost:3000` (đảm bảo đang ở trạng thái chưa đăng nhập).
2. Dán một link video ngắn bất kỳ (ví dụ: `https://www.youtube.com/shorts/uhx8tkXFrEE` hoặc link video TikTok).
3. Bấm nút "Phân tích kịch bản".
4. Sau 4-6 giây, màn hình hiển thị kết quả phân tích gồm Hook, Body, CTA cùng danh sách lời thoại khớp từng giây.
5. Dán tiếp video thứ hai để dùng hết lượt miễn phí thứ 2 của khách.
6. Khi dán video thứ ba và bấm phân tích, hệ thống sẽ chặn lại và tự động mở hộp thoại đăng nhập.

### Bước 2: Đăng nhập tài khoản
1. Trên hộp thoại xác thực, chọn "Đăng nhập với Google" hoặc điền email và mật khẩu để tạo tài khoản.
2. Sau khi đăng nhập xong, nhìn lên thanh Navbar ở góc trên bên phải: màn hình sẽ hiển thị ảnh đại diện và huy hiệu cấp hạn mức (3/3 lượt miễn phí trong ngày).

### Bước 3: Tạo kịch bản theo ngành hàng mới (Remix Studio)
1. Ở bảng kết quả phân tích video, bấm vào nút "Viết lại kịch bản theo ngành hàng".
2. Nhập ngành hàng mong muốn (ví dụ: *Bất động sản*, *Kinh doanh mỹ phẩm*, *Thời trang nam*).
3. Bấm nút "Tạo 3 kịch bản mới".
4. Hệ thống gọi Gemini Cascade và trả về 3 phiên bản kịch bản hoàn chỉnh. Bạn có thể bấm nút "Sao chép" ở từng phần để sử dụng ngay.

### Bước 4: Kiểm tra Lịch sử phân tích
1. Bấm vào biểu tượng Lịch sử trên thanh Navbar.
2. Danh sách các video vừa phân tích cùng các bản kịch bản remix trước đó sẽ hiển thị đầy đủ, chứng minh dữ liệu đã được lưu trữ thành công vào cơ sở dữ liệu Supabase.

### Bước 5: Kiểm tra cơ chế trừ credit và mở cổng thanh toán
1. Tiếp tục chạy phân tích thêm video để dùng hết 3 credit trong ngày của tài khoản.
2. Khi credit về 0, hệ thống tự động hiển thị bảng thanh toán nâng cấp Pro.
3. Kiểm tra mã QR VNPAY chính chủ (chủ tài khoản Nguyễn Lê Bảo Phong) cùng mã đơn hàng ngẫu nhiên `VSxxxx` và các nút sao chép thông tin chuyển khoản nhanh chóng.
