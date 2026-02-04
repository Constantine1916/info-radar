import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { DOMAINS } from '../lib/types';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [telegramStatus, setTelegramStatus] = useState<{ verified: boolean; chatId?: string }>({ verified: false });
  const [verificationCode, setVerificationCode] = useState('');
  const [pushing, setPushing] = useState(false);
  const fetchStartedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user && !fetchStartedRef.current) {
      fetchStartedRef.current = true;
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    if (fetchStartedRef.current) return;

    const session = await supabase?.auth.getSession();
    const token = session?.data.session?.access_token;
    fetchStartedRef.current = true;

    if (!supabase || !token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch subscriptions
      const subsRes = await fetch('/api/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subsData = await subsRes.json();
      setSubscriptions(subsData.subscriptions?.map((s: any) => s.domain) || []);

      // Fetch Bot config status
      const tgRes = await fetch('/api/bot/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tgData = await tgRes.json();
      setTelegramStatus({ verified: tgData.verified, chatId: tgData.chatId });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      fetchStartedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
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
    alert('订阅配置已保存！');
  };

  const handleUnbind = async () => {
    router.push('/settings');
  };

  const toggleDomain = (domain: string) => {
    const newSubs = subscriptions.includes(domain)
      ? subscriptions.filter((d) => d !== domain)
      : [...subscriptions, domain];
    setSubscriptions(newSubs);
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
        alert(`推送成功！已发送 ${data.itemsCount} 条信息`);
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
        <div className="text-center page-enter">
          <div className="text-4xl mb-4 animate-pulse">📡</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] page-enter">
      <Head>
        <title>Dashboard - Info Radar</title>
      </Head>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors">
            📡 Info Radar
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/hot" className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5">
              <span>🔥</span>
              <span>热门</span>
            </Link>
            <Link href="/history" className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5">
              <span>📊</span>
              <span>历史</span>
            </Link>
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Button variant="ghost" onClick={() => signOut()} className="hover:bg-gray-100">退出</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">欢迎回来</h2>
          <p className="text-gray-500">配置你的个性化信息订阅</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Telegram绑定 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl shadow-soft">
                ✉️
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Telegram</h3>
                <p className="text-xs text-gray-500">
                  {telegramStatus.verified ? '✓ 已绑定' : '未绑定'}
                </p>
              </div>
            </div>

            {telegramStatus.verified ? (
              <div className="space-y-3">
                <Button onClick={handlePushNow} disabled={pushing || subscriptions.length === 0} className="w-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  {pushing ? '推送中...' : '立即推送'}
                </Button>
                <Button variant="outline" onClick={handleUnbind} className="w-full hover:bg-gray-50">
                  管理配置
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerateCode} className="w-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                绑定 Telegram
              </Button>
            )}
          </div>

          {/* 订阅统计 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl shadow-soft">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">已订阅</h3>
                <p className="text-xs text-gray-500">
                  {subscriptions.length} / 9 个领域
                </p>
              </div>
            </div>
            <div className="text-4xl font-light text-gray-900">
              {subscriptions.length}
            </div>
          </div>

          {/* 推送统计 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl shadow-soft">
                📬
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">下次推送</h3>
                <p className="text-xs text-gray-500">
                  明天 09:00
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {subscriptions.length > 0 ? '✓ 自动推送' : '请先订阅'}
            </div>
          </div>
        </div>

        {/* 订阅配置 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">选择关注的领域</h3>
            <span className="text-sm text-gray-500">
              已选择 {subscriptions.length} / 9
            </span>
          </div>
          
          {/* 领域网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(DOMAINS).map(([key, { name, emoji, description }]) => {
              const isSelected = subscriptions.includes(key);
              return (
                <div
                  key={key}
                  onClick={() => toggleDomain(key)}
                  className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/10 hover:shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-md'
                  }`}
                >
                  {/* 选中标记 */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  
                  {/* 图标 */}
                  <div className="text-2.5xl mb-3">{emoji}</div>
                  
                  {/* 名称 */}
                  <div className={`text-base font-semibold ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {name}
                  </div>
                  
                  {/* 描述 */}
                  <div className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
                    {description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 操作按钮 */}
          <div className="mt-8 flex gap-4">
            <Button
              onClick={() => handleSaveSubscriptions(subscriptions)}
              className="flex-1 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              保存配置
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
              className="px-6 hover:bg-gray-50 transition-all"
            >
              {subscriptions.length === Object.keys(DOMAINS).length ? '取消全选' : '全选'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
