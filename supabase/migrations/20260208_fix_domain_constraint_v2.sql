-- 修复 subscriptions 表的 domain 检查约束 (v2)
-- 使用新约束名避免冲突

-- 1. 先删除旧约束（如果存在）
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_domain_check;

-- 2. 创建新约束（包含所有 domain）
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_domain_check_new
CHECK (domain IN (
  'AI', 
  'FullStack', 
  'ChinaPolicy', 
  'WorldPolitics', 
  'Investment', 
  'Crypto', 
  'Product', 
  'Design', 
  'Productivity', 
  'Hot', 
  'Entertainment'
));
