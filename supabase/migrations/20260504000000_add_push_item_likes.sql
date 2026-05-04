-- Store per-user likes for individual pushed history items.
CREATE TABLE IF NOT EXISTS public.push_item_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_history_id UUID NOT NULL REFERENCES public.push_history(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, push_history_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_push_item_likes_user_history
  ON public.push_item_likes(user_id, push_history_id);

ALTER TABLE public.push_item_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push item likes" ON public.push_item_likes;
CREATE POLICY "Users can view own push item likes" ON public.push_item_likes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push item likes" ON public.push_item_likes;
CREATE POLICY "Users can insert own push item likes" ON public.push_item_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push item likes" ON public.push_item_likes;
CREATE POLICY "Users can delete own push item likes" ON public.push_item_likes
  FOR DELETE USING (auth.uid() = user_id);
