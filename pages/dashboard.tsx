import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

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

    setLoading(false);
  };

  const handleGenerateCode = async () => {
    router.push('/settings');
  };

  const handleSaveSubscriptions = async (domains: string[]) => {
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
    return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Head>
        <title>Dashboard - Info Radar</title>
      </Head>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-medium text-gray-900">
            📡 Info Radar
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/hot" className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1">
              🔥 热门
            </Link>
            <Link href="/history" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              历史
            </Link>
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Button variant="ghost" onClick={() => signOut()}>退出</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-gray-900 mb-1">欢迎回来</h2>
          <p className="text-gray-500">配置你的个性化信息订阅</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Telegram绑定 */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                ✉️
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Telegram</h3>
                <p className="text-xs text-gray-500">
                  {telegramStatus.verified ? '已绑定' : '未绑定'}
                </p>
              </div>
            </div>

            {telegramStatus.verified ? (
              <div className="space-y-2">
                <Button onClick={handlePushNow} disabled={pushing || subscriptions.length === 0} className="w-full text-sm">
                  {pushing ? '推送中...' : '立即推送'}
                </Button>
                <Button variant="outline" onClick={handleUnbind} className="w-full text-sm">
                  管理配置
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerateCode} className="w-full text-sm">
                绑定 Telegram
              </Button>
            )}
          </div>

          {/* 订阅统计 */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">已订阅</h3>
                <p className="text-xs text-gray-500">
                  {subscriptions.length} / 9 个领域
                </p>
              </div>
            </div>
            <div className="text-3xl font-light text-gray-900">
              {subscriptions.length}
            </div>
          </div>

          {/* 推送统计 */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl">
                📬
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">下次推送</h3>
                <p className="text-xs text-gray-500">
                  明天 09:00
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {subscriptions.length > 0 ? '自动推送' : '请先订阅'}
            </div>
          </div>
        </div>

        {/* 订阅配置 */}
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">选择关注的领域</h3>
            <span className="text-sm text-gray-500">
              已选择 {subscriptions.length} / 9
            </span>
          </div>
          
          {/* 领域网格 */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DOMAINS).map(([key, { name, emoji, description }]) => {
              const isSelected = subscriptions.includes(key);
              return (
                <div
                  key={key}
                  onClick={() => toggleDomain(key)}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  {/* 选中标记 */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  
                  {/* 图标 */}
                  <div className="text-2xl mb-2">{emoji}</div>
                  
                  {/* 名称 */}
                  <div className={`text-sm font-medium ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {name}
                  </div>
                  
                  {/* 描述 */}
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 操作按钮 */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => handleSaveSubscriptions(subscriptions)}
              className="flex-1"
            >
              保存配置
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // 全选/取消全选
                const allDomains = Object.keys(DOMAINS);
                if (subscriptions.length === allDomains.length) {
                  handleSaveSubscriptions([]);
                } else {
                  handleSaveSubscriptions(allDomains);
                }
              }}
              className="px-4"
            >
              {subscriptions.length === Object.keys(DOMAINS).length ? '取消全选' : '全选'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}