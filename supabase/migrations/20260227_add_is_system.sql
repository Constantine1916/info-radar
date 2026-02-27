-- Add is_system column to user_feeds table
ALTER TABLE user_feeds 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Update existing feeds to be non-system
UPDATE user_feeds SET is_system = false WHERE is_system IS NULL;

-- Add comment
COMMENT ON COLUMN user_feeds.is_system IS 'Whether this feed is a system default feed';
