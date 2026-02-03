-- Add telegram_bot_token field to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN telegram_bot_token TEXT;

-- Add comment
COMMENT ON COLUMN public.user_profiles.telegram_bot_token IS 'User''s own Telegram bot token for receiving notifications';
