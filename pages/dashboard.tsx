import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DEFAULT_FEEDS, UserFeed } from '../lib/types';

export default function Dashboard() {
  const { user, loading: authLoading, signedIn, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feeds, setFeeds] = useState<UserFeed[]>([]);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [addingFeed, setAddingFeed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ verified: boolean; chatId?: string }>({ verified: false });
  const [wecomStatus, setWecomStatus] = useState<{ hasWebhook: boolean }>({ hasWebhook: false });
  const [pushingTelegram, setPushingTelegram] = useState(false);
  const [pushingWeCom, setPushingWeCom] = useState(false);
  const fetchStartedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !signedIn) {
      router.push('/auth/login');
      return;
    }
    if (signedIn && !fetchStartedRef.current) {
      fetchStartedRef.current = true;
      fetchData();
    }
  }, [authLoading, signedIn, router]);

  const getToken = async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const fetchData = async () => {
    const token = await getToken();
    if (!token) { setLoading(false); return; }

    try {
      const [feedsRes, tgRes, wecomRes] = await Promise.all([
        fetch('/api/feeds', { headers: { Authorization: \`Bearer \${token}\` } }),
        fetch('/api/bot/config', { headers: { Authorization: \`Bearer \${token}\` } }),
        fetch('/api/webhook/config', { headers: { Authorization: \`Bearer \${token}\` } }),
      ]);

      if (feedsRes.ok) {
        const data = await feedsRes.json();
        setFeeds(data.feeds || []);
      }
      if (tgRes.ok) {
        const data = await tgRes.json();
        setTelegramStatus({ verified: data.verified, chatId: data.chatId });
      }
      if (wecomRes.ok) {
        const data = await wecomRes.json();
        setWecomStatus({ hasWebhook: data.hasWebhook });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async () => {
    if (!newFeedName || !newFeedUrl) return;
    setAddingFeed(true);
    const token = await getToken();
    if (!token) { setAddingFeed(false); return; }

    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ name: newFeedName, url: newFeedUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeeds(prev => [...prev, data.feed]);
        setNewFeedName('');
        setNewFeedUrl('');
        setShowAddForm(false);
      } else {
        alert(data.error || '添加失败');
      }
    } catch { alert('网络错误'); }
    finally { setAddingFeed(false); }
  };

  const handleDeleteFeed = async (id: string) => {
    if (!confirm('确定删除这个 RSS 源？')) return;
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/feeds', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setFeeds(prev => prev.filter(f => f.id !== id));
      else alert('删除失败');
    } catch { alert('网络错误'); }
  };

  const handleAddDefaults = async () => {
    const token = await getToken();
    if (!token) return;
    for (const df of DEFAULT_FEEDS) {
      if (feeds.some(f => f.url === df.url)) continue;
      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
          body: JSON.stringify(df),
        });
        if (res.ok) {
          const data = await res.json();
          setFeeds(prev => [...prev, data.feed]);
        }
      } catch {}
    }
  };

  const handlePush = async (ch: 'telegram' | 'wecom') => {
    const setter = ch === 'telegram' ? setPushingTelegram : setPushingWeCom;
    setter(true);
    const token = await getToken();
    if (!token) { setter(false); return; }

    try {
      const res = await fetch(\`/api/push-now?channel=\${ch}\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` },
      });
      const data = await res.json();
      if (res.ok) alert(\`推送成功！已发送 \${data.itemsCount} 条信息\`);
      else alert(data.error || '推送失败');
    } catch { alert('网络错误'); }
    finally { setter(false); }
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

      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold text-gray-900">📡 Info Radar</Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Button variant="ghost" onClick={() => signOut()}>退出</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">欢迎回来</h2>
          <p className="text-gray-500">管理你的 RSS 订阅源，接收定时推送</p>
        </div>

        {/* 推送渠道卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Telegram */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">✉️</div>
              <div>
                <h3 className="font-semibold text-gray-900">Telegram</h3>
                <p className="text-xs text-gray-500">{telegramStatus.verified ? '✓ 已绑定' : '未绑定'}</p>
              </div>
            </div>
            {telegramStatus.verified ? (
              <div className="space-y-3">
                <Button onClick={() => handlePush('telegram')} disabled={pushingTelegram || feeds.length === 0} className="w-full">
                  {pushingTelegram ? '推送中...' : '立即推送'}
                </Button>
                <Button variant="outline" onClick={() => router.push('/settings')} className="w-full">管理配置</Button>
              </div>
            ) : (
              <Button onClick={() => router.push('/settings')} className="w-full">绑定 Telegram</Button>
            )}
          </div>

          {/* 企业微信 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">💼</div>
              <div>
                <h3 className="font-semibold text-gray-900">企业微信</h3>
                <p className="text-xs text-gray-500">{wecomStatus.hasWebhook ? '✓ 已绑定' : '未绑定'}</p>
              </div>
            </div>
            {wecomStatus.hasWebhook ? (
              <div className="space-y-3">
                <Button onClick={() => handlePush('wecom')} disabled={pushingWeCom || feeds.length === 0} className="w-full bg-green-500 hover:bg-green-600">
                  {pushingWeCom ? '推送中...' : '立即推送'}
                </Button>
                <Button variant="outline" onClick={() => router.push('/settings')} className="w-full">管理配置</Button>
              </div>
            ) : (
              <Button onClick={() => router.push('/settings')} className="w-full bg-green-500 hover:bg-green-600">绑定企业微信</Button>
            )}
          </div>
        </div>

        {/* RSS 源管理 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">我的 RSS 源</h3>
            <div className="flex gap-2">
              {feeds.length === 0 && (
                <Button variant="outline" onClick={handleAddDefaults} className="text-sm">
                  添加推荐源
                </Button>
              )}
              <Button onClick={() => setShowAddForm(!showAddForm)} className="text-sm">
                {showAddForm ? '取消' : '+ 添加源'}
              </Button>
            </div>
          </div>

          {/* 添加表单 */}
          {showAddForm && (
            <div className="mb-6 p-5 bg-gray-50 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <Input
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  placeholder="例如：Hacker News"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RSS URL</label>
                <Input
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  placeholder="https://example.com/feed.xml"
                />
              </div>
              <Button onClick={handleAddFeed} disabled={addingFeed || !newFeedName || !newFeedUrl} className="w-full">
                {addingFeed ? '添加中...' : '确认添加'}
              </Button>
            </div>
          )}

          {/* 源列表 */}
          {feeds.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-4">📭</div>
              <p>还没有订阅任何 RSS 源</p>
              <p className="text-sm mt-2">点击上方「添加推荐源」快速开始</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feeds.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{feed.name}</div>
                    <div className="text-xs text-gray-400 truncate mt-1">{feed.url}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteFeed(feed.id)}
                    className="ml-4 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    title="删除"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
