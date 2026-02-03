-- Create profile for existing users who don't have one
INSERT INTO public.user_profiles (id, created_at, updated_at)
SELECT 
  au.id,
  NOW(),
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
);

-- Show result
SELECT 
  u.email,
  u.id,
  up.id as profile_id,
  up.telegram_verified,
  up.telegram_chat_id
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id;
