import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { DOMAINS } from '../lib/types';

export default function Dashboard() {
  const { user, loading: authLoading, signedIn, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [telegramStatus, setTelegramStatus] = useState<{ verified: boolean; chatId?: string }>({ verified: false });
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    if (!authLoading && !signedIn) {
      router.push('/auth/login');
      return;
    }
    if (signedIn) {
      fetchData();
    }
  }, [authLoading, signedIn, router]);

  const fetchData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    const token = session.access_token;

    try {
      const subsRes = await fetch('/api/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subsData = await subsRes.json();
      setSubscriptions(subsData.subscriptions?.map((s: any) => s.domain) || []);

      const tgRes = await fetch('/api/bot/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tgData = await tgRes.json();
      setTelegramStatus({ verified: tgData.verified, chatId: tgData.chatId });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = () => {
    router.push('/settings');
  };

  const handleSaveSubscriptions = async (domains: string[]) => {
    if (!supabase) return;
    
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ domains }),
    });

    setSubscriptions(domains);
  };

  const handlePushNow = async () => {
    if (!supabase) return;
    
    setPushing(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/push-now', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        alert(`已发送 ${data.itemsCount} 条信息`);
      } else {
        alert(data.error || '推送失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setPushing(false);
    }
  };

  if (authLoading || loading) {
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
    <div className="min-h-screen bg-[#fafafa]">
      <Head>
        <title>Dashboard - Info Radar</title>
      </Head>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-base font-medium text-gray-900">
            Info Radar
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/hot" className="text-gray-500 hover:text-gray-900">
              热门
            </Link>
            <Link href="/history" className="text-gray-500 hover:text-gray-900">
              历史
            </Link>
            <span className="text-gray-400">{user?.email}</span>
            <button onClick={() => signOut()} className="text-gray-500 hover:text-gray-900">
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Section 1: Status Cards */}
        <section className="grid grid-cols-3 gap-px bg-gray-200 mb-12">
          {/* Telegram Card */}
          <div className="bg-white p-6">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Telegram</div>
            <div className="text-sm text-gray-600 mb-4">
              {telegramStatus.verified ? '已绑定' : '未绑定'}
            </div>
            {telegramStatus.verified ? (
              <div className="space-y-2">
                <Button onClick={handlePushNow} disabled={pushing || subscriptions.length === 0} className="w-full">
                  {pushing ? '推送中...' : '立即推送'}
                </Button>
                <button onClick={handleGenerateCode} className="w-full text-xs text-gray-400 hover:text-gray-600">
                  管理配置
                </button>
              </div>
            ) : (
              <Button onClick={handleGenerateCode}>
                绑定
              </Button>
            )}
          </div>

          {/* Subscriptions Card */}
          <div className="bg-white p-6">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">已订阅</div>
            <div className="text-4xl font-light text-gray-900 mb-1">
              {subscriptions.length}
            </div>
            <div className="text-xs text-gray-400">
              / 9 个领域
            </div>
          </div>

          {/* Next Push Card */}
          <div className="bg-white p-6">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">下次推送</div>
            <div className="text-sm text-gray-600 mb-1">
              明天 09:00
            </div>
            <div className="text-xs text-gray-400">
              {subscriptions.length > 0 ? '自动推送' : '请先订阅'}
            </div>
          </div>
        </section>

        {/* Section 2: Subscription Config */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">订阅领域</h2>
            <span className="text-sm text-gray-400">
              {subscriptions.length} / 9
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-px bg-gray-200">
            {Object.entries(DOMAINS).map(([key, { name, emoji, description }]) => {
              const isSelected = subscriptions.includes(key);
              return (
                <div
                  key={key}
                  onClick={() => {
                    const newSubs = isSelected
                      ? subscriptions.filter((d) => d !== key)
                      : [...subscriptions, key];
                    setSubscriptions(newSubs);
                  }}
                  className={`bg-white p-5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{emoji}</span>
                      <span className={`text-sm ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                        {name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-gray-900">×</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-4">
            <Button onClick={() => handleSaveSubscriptions(subscriptions)}>
              保存
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const allDomains = Object.keys(DOMAINS);
                if (subscriptions.length === allDomains.length) {
                  handleSaveSubscriptions([]);
                } else {
                  handleSaveSubscriptions(allDomains);
                }
              }}
            >
              {subscriptions.length === Object.keys(DOMAINS).length ? '取消全选' : '全选'}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
