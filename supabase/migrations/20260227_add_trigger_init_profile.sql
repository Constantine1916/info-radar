-- 创建函数：新用户注册时自动创建 user_profiles 记录
CREATE OR REPLACE FUNCTION public.init_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入 user_profiles 记录（所有推送配置字段初始化为空/false）
  INSERT INTO public.user_profiles (
    id,
    telegram_chat_id,
    telegram_verified,
    telegram_bot_token,
    webhook_key,
    webhook_enabled,
    email_address,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NULL,
    false,
    NULL,
    NULL,
    false,
    NULL,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- 如果已存在则跳过
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：在 auth.users 插入新记录后执行
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.init_user_profile();

-- 说明：
-- 1. 这个触发器会在 init_user_default_feeds 之前或之后执行（顺序不重要）
-- 2. 确保新用户一定有 user_profiles 记录
-- 3. 所有推送配置字段初始化为未配置状态
