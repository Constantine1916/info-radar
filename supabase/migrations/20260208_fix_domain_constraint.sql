-- 修复 subscriptions 表的 domain 检查约束
-- 包含所有新添加的 domain

-- 1. 先删除旧的约束
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_domain_check;

-- 2. 创建新的约束（包含所有 domain）
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_domain_check 
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
