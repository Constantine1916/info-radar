-- Add email configuration to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_address TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_email ON user_settings(email_address) WHERE email_address IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_settings.email_enabled IS 'Whether email push is enabled';
COMMENT ON COLUMN user_settings.email_address IS 'Email address for push notifications';
COMMENT ON COLUMN user_settings.email_verified IS 'Whether the email has been verified';
