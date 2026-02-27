-- Add email configuration to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_address TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email_address) WHERE email_address IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.user_profiles.email_enabled IS 'Whether email push is enabled';
COMMENT ON COLUMN public.user_profiles.email_address IS 'Email address for push notifications';
COMMENT ON COLUMN public.user_profiles.email_verified IS 'Whether the email has been verified';
