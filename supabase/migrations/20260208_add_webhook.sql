-- 添加企业微信 webhook 字段
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS webhook_key TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT FALSE;
