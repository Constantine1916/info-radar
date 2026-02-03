import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router, mounted]);

  // Show content after mounting, don't wait for auth
  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Head>
        <title>Info Radar - 打破信息差</title>
        <meta name="description" content="个人信息雷达系统" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            📡 Info Radar
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            打破信息差，主动捕获关键信息
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg">开始使用</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">登录</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">个性化订阅</h3>
              <p className="text-sm text-muted-foreground">选择你关注的领域，精准推送</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">智能过滤</h3>
              <p className="text-sm text-muted-foreground">自动过滤低质量内容和标题党</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">Telegram推送</h3>
              <p className="text-sm text-muted-foreground">每日自动推送到你的Telegram</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <a 
              href="https://github.com/Constantine1916/info-radar" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
