import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../lib/auth-context';

export default function Login() {
  const router = useRouter();
  const { signedIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && signedIn) {
      router.push('/dashboard');
    }
  }, [authLoading, signedIn, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!supabase) {
      setError('系统初始化中');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setTimeout(() => {
        router.push('/dashboard');
      }, 300);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="text-3xl mb-3">Info Radar</div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <Head>
        <title>登录 - Info Radar</title>
      </Head>

      <div className="w-full max-w-sm px-6">
        <div className="mb-10">
          <Link href="/" className="block text-center text-3xl mb-3">
            Info Radar
          </Link>
          <h1 className="text-center text-base text-gray-600">登录</h1>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-xs text-red-600">{error}</div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">密码</label>
              <Input
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-xs text-gray-400">
              还没有账号？{' '}
              <Link href="/auth/signup" className="text-gray-600 hover:text-gray-900">
                注册
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
