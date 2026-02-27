-- 给 user_feeds 表添加 is_system 字段
ALTER TABLE user_feeds ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_feeds_is_system ON user_feeds(is_system);

-- 更新 RLS 策略：系统源不能被删除
DROP POLICY IF EXISTS "Users can delete own feeds" ON user_feeds;
CREATE POLICY "Users can delete own custom feeds" ON user_feeds
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);
