-- 創建收容所動物按讚記錄表
CREATE TABLE IF NOT EXISTS public.user_shelter_animal_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shelter_animal_id text NOT NULL,
  shelter_animal_data jsonb NOT NULL, -- 儲存完整的收容所動物資料
  liked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT user_shelter_animal_likes_pkey PRIMARY KEY (id),
  CONSTRAINT user_shelter_animal_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_shelter_animal_likes_unique UNIQUE (user_id, shelter_animal_id)
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_user_shelter_animal_likes_user_id ON public.user_shelter_animal_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shelter_animal_likes_shelter_animal_id ON public.user_shelter_animal_likes(shelter_animal_id);
CREATE INDEX IF NOT EXISTS idx_user_shelter_animal_likes_liked_at ON public.user_shelter_animal_likes(liked_at);

-- 設定 RLS (Row Level Security)
ALTER TABLE public.user_shelter_animal_likes ENABLE ROW LEVEL SECURITY;

-- 允許用戶查看自己的按讚記錄
DROP POLICY IF EXISTS "Users can view own shelter animal likes" ON public.user_shelter_animal_likes;
CREATE POLICY "Users can view own shelter animal likes" ON public.user_shelter_animal_likes
  FOR SELECT USING (auth.uid() = user_id);

-- 允許用戶新增自己的按讚記錄
DROP POLICY IF EXISTS "Users can insert own shelter animal likes" ON public.user_shelter_animal_likes;
CREATE POLICY "Users can insert own shelter animal likes" ON public.user_shelter_animal_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允許用戶刪除自己的按讚記錄
DROP POLICY IF EXISTS "Users can delete own shelter animal likes" ON public.user_shelter_animal_likes;
CREATE POLICY "Users can delete own shelter animal likes" ON public.user_shelter_animal_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 註解
COMMENT ON TABLE public.user_shelter_animal_likes IS '用戶收容所動物按讚記錄表';
COMMENT ON COLUMN public.user_shelter_animal_likes.user_id IS '用戶ID';
COMMENT ON COLUMN public.user_shelter_animal_likes.shelter_animal_id IS '收容所動物ID';
COMMENT ON COLUMN public.user_shelter_animal_likes.shelter_animal_data IS '收容所動物完整資料(JSONB格式)';
COMMENT ON COLUMN public.user_shelter_animal_likes.liked_at IS '按讚時間';