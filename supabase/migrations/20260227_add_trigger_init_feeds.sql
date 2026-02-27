-- 创建函数：新用户注册时自动初始化默认源
CREATE OR REPLACE FUNCTION public.init_user_default_feeds()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入 7 个系统默认源
  INSERT INTO public.user_feeds (user_id, name, url, enabled, is_system, sort_order)
  VALUES
    (NEW.id, 'Hacker News', 'http://101.32.243.232:1200/hackernews/newest', true, true, 0),
    (NEW.id, '36氪', 'http://101.32.243.232:1200/36kr/newsflashes', true, true, 1),
    (NEW.id, '少数派', 'http://101.32.243.232:1200/sspai/index', true, true, 2),
    (NEW.id, 'GitHub Trending 每日', 'http://101.32.243.232:1200/github/trending/daily', true, true, 3),
    (NEW.id, 'GitHub Trending 每周', 'http://101.32.243.232:1200/github/trending/weekly', true, true, 4),
    (NEW.id, '知乎热榜', 'http://101.32.243.232:1200/zhihu/hotlist', true, true, 5),
    (NEW.id, 'B站热榜', 'http://101.32.243.232:1200/bilibili/ranking/0/3/1', true, true, 6);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：在 auth.users 插入新记录后执行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.init_user_default_feeds();

-- 说明：
-- 1. SECURITY DEFINER 让函数以创建者权限执行（绕过 RLS）
-- 2. 触发器在 auth.users 插入后立即执行
-- 3. 新用户注册后自动拥有 7 个默认源
