-- =============================================================================
-- VIRAL SCRIPT AI - CƠ SỞ DỮ LIỆU & BẢO MẬT TRÊN SUPABASE (POSTGRESQL)
-- Phiên bản cập nhật: Hỗ trợ cả khách trải nghiệm vãng lai (Guest) và User đăng nhập
-- =============================================================================

-- 1. BẢNG HỒ SƠ NGƯỜI DÙNG (Liên kết trực tiếp với auth.users của Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  daily_credits INT DEFAULT 3,
  last_reset_date DATE DEFAULT CURRENT_DATE,    -- Ngày reset lượt cuối (so sánh để reset hàng ngày)
  subscription_tier TEXT DEFAULT 'free',         -- 'free' | 'pro'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 2. BẢNG LƯU TRỮ KỊCH BẢN ĐÃ GIẢI PHÃU (ANALYSES)
-- user_id cho phép NULL để khách thử nghiệm chưa đăng nhập vẫn lưu được vào Database
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_platform TEXT, -- tiktok, youtube_shorts, instagram_reels
  transcript_data JSONB NOT NULL, -- Lời thoại kèm timestamp từng câu
  hook_analysis JSONB NOT NULL,   -- Phân tích câu mở đầu 3 giây
  body_analysis JSONB NOT NULL,   -- Phân tích các nút thắt giữ chân
  cta_analysis JSONB NOT NULL,    -- Phân tích câu chốt kêu gọi hành động
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3. BẢNG LƯU CÁC KỊCH BẢN TÁI CẤU TRÚC (REMIXED SCRIPTS)
CREATE TABLE IF NOT EXISTS public.remixed_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_niche TEXT NOT NULL,
  generated_script TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 4. BẬT BẢO MẬT KHÓA DÒNG (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remixed_scripts ENABLE ROW LEVEL SECURITY;

-- 5. CÁC QUY TẮC CẤP QUYỀN (CHO PHÉP LƯU & XEM DỮ LIỆU)
DROP POLICY IF EXISTS "Allow insert analyses" ON public.analyses;
CREATE POLICY "Allow insert analyses" ON public.analyses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read analyses" ON public.analyses;
CREATE POLICY "Allow read analyses" ON public.analyses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert remixed_scripts" ON public.remixed_scripts;
CREATE POLICY "Allow insert remixed_scripts" ON public.remixed_scripts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read remixed_scripts" ON public.remixed_scripts;
CREATE POLICY "Allow read remixed_scripts" ON public.remixed_scripts FOR SELECT USING (true);

DROP POLICY IF EXISTS "User can view own profile" ON public.profiles;
CREATE POLICY "User can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "User can insert own profile" ON public.profiles;
CREATE POLICY "User can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "User can update own profile" ON public.profiles;
CREATE POLICY "User can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. TỰ ĐỘNG KHỞI TẠO PROFILE KHI CÓ USER MỚI ĐĂNG KÝ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. QUẢN LÝ HẠN MỨC (QUOTA) & NẠP LƯỢT (PAYMENT TRANSACTIONS)
-- Đảm bảo cột luôn tồn tại dù schema đã chạy từ phiên bản cũ
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Hàm trừ lượt an toàn nguyên tử (Atomic - chống race condition khi bấm đồng thời)
CREATE OR REPLACE FUNCTION public.deduct_user_credit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_credits INT;
  v_last_date DATE;
  v_tier TEXT;
BEGIN
  SELECT daily_credits, last_reset_date, subscription_tier 
  INTO v_credits, v_last_date, v_tier
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Nếu là gói Pro thì không giới hạn lượt
  IF v_tier = 'pro' THEN
    RETURN jsonb_build_object('success', true, 'remaining', 9999, 'tier', 'pro');
  END IF;

  -- Nếu sang ngày mới, tự động hồi phục 3 lượt miễn phí
  IF v_last_date < CURRENT_DATE THEN
    v_credits := 3;
    v_last_date := CURRENT_DATE;
  END IF;

  -- Nếu hết lượt trong ngày
  IF v_credits <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_credits', 'remaining', 0, 'tier', v_tier);
  END IF;

  -- Trừ 1 lượt
  v_credits := v_credits - 1;
  UPDATE public.profiles 
  SET daily_credits = v_credits, last_reset_date = v_last_date 
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'remaining', v_credits, 'tier', v_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bảng lưu trữ đơn nạp tiền & gói cước
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_code TEXT UNIQUE NOT NULL,
  plan_type TEXT NOT NULL, -- 'single_5k', 'pack_20k', 'pro_monthly_99k'
  amount INT NOT NULL,
  credits_added INT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
CREATE POLICY "Users can create own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Hàm kích hoạt nạp lượt hoặc nâng cấp gói Pro an toàn
CREATE OR REPLACE FUNCTION public.activate_order_plan(p_order_code TEXT, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_new_credits INT;
  v_new_tier TEXT;
BEGIN
  SELECT * INTO v_order FROM public.transactions 
  WHERE order_code = p_order_code AND user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'order_not_found');
  END IF;

  IF v_order.status = 'completed' THEN
    RETURN jsonb_build_object('success', true, 'reason', 'already_completed');
  END IF;

  -- Cập nhật đơn hàng thành công
  UPDATE public.transactions SET status = 'completed' WHERE id = v_order.id;

  -- Nâng cấp theo loại gói
  IF v_order.plan_type = 'pro_monthly_99k' THEN
    UPDATE public.profiles 
    SET subscription_tier = 'pro', daily_credits = 9999 
    WHERE id = p_user_id
    RETURNING daily_credits, subscription_tier INTO v_new_credits, v_new_tier;
  ELSE
    UPDATE public.profiles 
    SET daily_credits = daily_credits + v_order.credits_added 
    WHERE id = p_user_id
    RETURNING daily_credits, subscription_tier INTO v_new_credits, v_new_tier;
  END IF;

  RETURN jsonb_build_object('success', true, 'credits', v_new_credits, 'tier', v_new_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. BẢNG LƯU ĐÁNH GIÁ NGƯỜI DÙNG (FEEDBACK)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- NULL nếu khách chưa đăng nhập
  email TEXT,                    -- Email tự nhập (dùng khi khách vãng lai)
  rating INT CHECK (rating BETWEEN 1 AND 5),  -- 1-5 sao
  message TEXT NOT NULL,         -- Nội dung đánh giá
  page_context TEXT,             -- Trang hoặc tính năng đang dùng khi gửi feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Ai cũng được phép gửi feedback (kể cả khách chưa đăng nhập)
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);

-- Chỉ user xem được feedback của chính mình
DROP POLICY IF EXISTS "User can view own feedback" ON public.feedback;
CREATE POLICY "User can view own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
