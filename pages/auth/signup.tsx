import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../lib/auth-context';

export default function Signup() {
  const router = useRouter();
  const { signedIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 如果已经登录，直接跳转到 Dashboard
  useEffect(() => {
    if (!authLoading && signedIn && success) {
      router.push('/home');
    }
  }, [authLoading, signedIn, success, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!supabase) {
      setError('系统初始化中，请稍后再试');
      setLoading(false);
      return;
    }

    // 1. 先尝试注册
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    if (signupError) {
      // 检查是否是"账号已存在"错误
      if (signupError.message.includes('User already registered')) {
        setError('账号已存在！正在跳转登录页...');
        setTimeout(() => router.push('/auth/login'), 1500);
      } else {
        setError(signupError.message);
      }
      setLoading(false);
      return;
    }

    // 2. 注册成功，尝试自动登录
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      // 自动登录失败，说明需要邮箱验证
      setError('注册成功！但需要邮箱验证，请查收邮件并点击确认链接');
    } else {
      // 自动登录成功
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <Head>
        <title>注册 - Info Radar</title>
      </Head>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl">📡</span>
          </Link>
          <h1 className="mt-4 text-xl font-medium text-gray-900">注册 Info Radar</h1>
        </div>

        {/* Signup Form */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-soft">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg">
                注册成功！正在跳转...
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">密码</label>
              <Input
                type="password"
                placeholder="至少6位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-center text-gray-500">
            已有账号？{' '}
            <Link href="/auth/login" className="text-gray-900 hover:underline">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}