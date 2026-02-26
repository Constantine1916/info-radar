-- 创建 user_feeds 表：用户自定义 RSS 源
CREATE TABLE IF NOT EXISTS public.user_feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- RLS
ALTER TABLE public.user_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feeds" ON public.user_feeds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feeds" ON public.user_feeds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feeds" ON public.user_feeds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feeds" ON public.user_feeds
  FOR DELETE USING (auth.uid() = user_id);

-- Service role 全权访问
CREATE POLICY "Service role full access" ON public.user_feeds
  FOR ALL USING (true) WITH CHECK (true);
