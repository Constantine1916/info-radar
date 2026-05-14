-- Store per-feed push item limits. Defaults preserve the current behavior.
ALTER TABLE public.user_feeds
  ADD COLUMN IF NOT EXISTS push_limit INTEGER;

UPDATE public.user_feeds
SET push_limit = 5
WHERE push_limit IS NULL;

ALTER TABLE public.user_feeds
  ALTER COLUMN push_limit SET DEFAULT 5,
  ALTER COLUMN push_limit SET NOT NULL;

ALTER TABLE public.user_feeds
  DROP CONSTRAINT IF EXISTS user_feeds_push_limit_range;

ALTER TABLE public.user_feeds
  ADD CONSTRAINT user_feeds_push_limit_range
  CHECK (push_limit BETWEEN 1 AND 100);

COMMENT ON COLUMN public.user_feeds.push_limit IS 'Maximum number of items to push per feed, from 1 to 100.';
