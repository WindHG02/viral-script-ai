-- =============================================================================
-- VIRAL SCRIPT AI — SQL MIGRATION v2
-- Chạy file này trong: Supabase Dashboard → SQL Editor → New Query → Run
-- Chạy an toàn nhiều lần nhờ IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- =============================================================================

-- BƯỚC 1: Bổ sung cột còn thiếu trong bảng profiles (quan trọng cho daily reset)
-- Nếu bảng profiles chưa có 2 cột này thì daily credit KHÔNG tự reset được
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Cập nhật các user cũ chưa có last_reset_date (set về hôm nay để reset hoạt động từ ngày mai)
UPDATE public.profiles 
SET last_reset_date = CURRENT_DATE 
WHERE last_reset_date IS NULL;

-- Cập nhật các user cũ chưa có subscription_tier
UPDATE public.profiles 
SET subscription_tier = 'free' 
WHERE subscription_tier IS NULL;


-- BƯỚC 2: Tạo bảng FEEDBACK (lưu đánh giá người dùng)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL nếu khách chưa đăng nhập
  email TEXT,                      -- Email tự nhập (dùng khi khách vãng lai)
  rating INT CHECK (rating BETWEEN 1 AND 5),  -- 1-5 sao
  message TEXT NOT NULL,           -- Nội dung đánh giá (bắt buộc)
  page_context TEXT DEFAULT 'general', -- Trang/tính năng đang dùng khi gửi feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Bật Row Level Security cho bảng feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Ai cũng được phép gửi feedback (kể cả khách chưa đăng nhập)
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

-- Policy: Chỉ user đăng nhập xem được feedback của chính mình
DROP POLICY IF EXISTS "User can view own feedback" ON public.feedback;
CREATE POLICY "User can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);


-- BƯỚC 3: Cập nhật hàm deduct_user_credit để đảm bảo reset hoạt động đúng
-- (Viết lại bằng CREATE OR REPLACE nên chạy lại vẫn an toàn)
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

  -- Nếu sang ngày mới (hoặc last_reset_date NULL), tự động hồi phục 3 lượt miễn phí
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
    v_credits := 3;
    v_last_date := CURRENT_DATE;
  END IF;

  -- Nếu hết lượt trong ngày
  IF v_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'out_of_credits',
      'remaining', 0,
      'tier', v_tier
    );
  END IF;

  -- Trừ 1 lượt và cập nhật
  v_credits := v_credits - 1;
  UPDATE public.profiles
  SET daily_credits = v_credits, last_reset_date = v_last_date
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'remaining', v_credits, 'tier', v_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- BƯỚC 4: Kiểm tra kết quả sau khi chạy
SELECT 'Kiem tra cot profiles:' as step;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Kiem tra bang feedback:' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'feedback' AND table_schema = 'public'
ORDER BY ordinal_position;
