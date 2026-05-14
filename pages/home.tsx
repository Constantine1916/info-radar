import { useEffect, useState, useRef, useCallback } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { message } from 'antd';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { SYSTEM_FEEDS, UserFeed } from '../lib/types';
import { FeedItem } from '../components/FeedItem';
import { FeedDialog } from '../components/FeedDialog';
import { DEFAULT_PUSH_LIMIT, normalizePushLimit } from '../lib/feed-push-limit';


export default function Dashboard() {
  const { user, loading: authLoading, signedIn, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feeds, setFeeds] = useState<UserFeed[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [dialogFeedId, setDialogFeedId] = useState<string | null>(null);
  const [dialogUrl, setDialogUrl] = useState('');
  const [dialogName, setDialogName] = useState('');
  const [dialogSaving, setDialogSaving] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ verified: boolean; chatId?: string }>({ verified: false });
  const [wecomStatus, setWecomStatus] = useState<{ hasWebhook: boolean }>({ hasWebhook: false });
  const [emailStatus, setEmailStatus] = useState<{ verified: boolean }>({ verified: false });
  const [pushingTelegram, setPushingTelegram] = useState(false);
  const [pushingWeCom, setPushingWeCom] = useState(false);
  const [pushingEmail, setPushingEmail] = useState(false);
  const fetchStartedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authLoading) {
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
  // Dialog handlers
  const openAddDialog = () => {
    setDialogMode('add');
    setDialogFeedId(null);
    setDialogUrl('');
    setDialogName('');
    setDialogOpen(true);
  };

  const openEditDialog = (feed: UserFeed) => {
    setDialogMode('edit');
    setDialogFeedId(feed.id);
    setDialogUrl(feed.url);
    setDialogName(feed.name);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogUrl('');
    setDialogName('');
    setDialogFeedId(null);
  };

  const handleDialogSubmit = async (url: string, name: string) => {
    const token = await getToken();
    if (!token) throw new Error('未登录，请重新登录');

    if (dialogMode === 'add') {
      // 添加模式：先尝试智能识别
      const smartRes = await fetch('/api/feeds/smart-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      const smartData = await smartRes.json();

      if (smartRes.ok) {
        setFeeds(prev => [...prev, smartData.feed]);
        closeDialog();
        message.success(`✓ 已添加：${smartData.feed.name}`);
      } else if (smartData.hint) {
        throw new Error(`${smartData.error}\n\n提示：${smartData.hint}`);
      } else if (name) {
        // 智能识别失败，尝试手动添加
        const manualRes = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, url }),
        });
        const manualData = await manualRes.json();
        if (manualRes.ok) {
          setFeeds(prev => [...prev, manualData.feed]);
          closeDialog();
          message.success(`✓ 已添加：${manualData.feed.name}`);
        } else {
          throw new Error(manualData.error || '添加失败');
        }
      } else {
        throw new Error(smartData.error || '添加失败');
      }
    } else {
      // 编辑模式
      if (!name) throw new Error('请输入名称');
      const res = await fetch('/api/feeds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: dialogFeedId, name, url }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeeds(prev => prev.map(f => f.id === dialogFeedId ? data.feed : f));
        closeDialog();
        message.success('✓ 已保存');
      } else {
        throw new Error(data.error || '保存失败');
      }
    }
  };


  const handleSignOut = async () => {
    await signOut();
    router.push('/landing');
  };

  const fetchData = async () => {
    const token = await getToken();
    if (!token) { setLoading(false); return; }

    try {
      const [feedsRes, tgRes, wecomRes, emailRes] = await Promise.all([
        fetch('/api/feeds', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bot/config', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/webhook/config', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/email/config', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (feedsRes.ok) {
        const data = await feedsRes.json();
        const userFeeds = data.feeds || [];
        setFeeds(userFeeds.map((feed: UserFeed) => ({
          ...feed,
          push_limit: feed.push_limit ?? DEFAULT_PUSH_LIMIT,
        })));
      }
      if (tgRes.ok) {
        const data = await tgRes.json();
        setTelegramStatus({ verified: data.verified, chatId: data.chatId });
      }
      if (wecomRes.ok) {
        const data = await wecomRes.json();
        setWecomStatus({ hasWebhook: data.hasWebhook });
      }
      if (emailRes.ok) {
        const emailData = await emailRes.json();
        setEmailStatus({ 
          verified: emailData.verified || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteFeed = async (id: string) => {
    if (!confirm('确定删除这个 RSS 源？')) return;
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/feeds', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setFeeds(prev => prev.filter(f => f.id !== id));
      else alert('删除失败');
    } catch { alert('网络错误'); }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    const token = await getToken();
    if (!token) return;

    // 乐观更新
    setFeeds(prev => prev.map(f => f.id === id ? { ...f, enabled } : f));

    try {
      const res = await fetch('/api/feeds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, enabled }),
      });
      if (!res.ok) {
        // 回滚
        setFeeds(prev => prev.map(f => f.id === id ? { ...f, enabled: !enabled } : f));
        alert('更新失败');
      }
    } catch {
      setFeeds(prev => prev.map(f => f.id === id ? { ...f, enabled: !enabled } : f));
      alert('网络错误');
    }
  };

  const handlePushLimitChange = async (id: string, pushLimit: number) => {
    let normalizedPushLimit: number;
    try {
      normalizedPushLimit = normalizePushLimit(pushLimit);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '推送条数不正确');
      return;
    }

    const previousFeed = feeds.find(f => f.id === id);
    if (!previousFeed || previousFeed.push_limit === normalizedPushLimit) return;

    const token = await getToken();
    if (!token) return;

    setFeeds(prev => prev.map(f => f.id === id ? { ...f, push_limit: normalizedPushLimit } : f));

    try {
      const res = await fetch('/api/feeds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, push_limit: normalizedPushLimit }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeeds(prev => prev.map(f => f.id === id ? data.feed : f));
      } else {
        setFeeds(prev => prev.map(f => f.id === id ? previousFeed : f));
        message.error(data.error || '更新推送条数失败');
      }
    } catch {
      setFeeds(prev => prev.map(f => f.id === id ? previousFeed : f));
      message.error('网络错误');
    }
  };







  const saveOrder = useCallback(async (orderedFeeds: UserFeed[]) => {
    const token = await getToken();
    if (!token) return;
    const orders = orderedFeeds.map((f, i) => ({ id: f.id, sort_order: i }));
    try {
      await fetch('/api/feeds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orders }),
      });
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  }, []);

  const handleReorder = (newFeeds: UserFeed[]) => {
    setFeeds(newFeeds);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveOrder(newFeeds), 500);
  };

  const handlePush = async (ch: 'telegram' | 'wecom' | 'email') => {
    let setter: (v: boolean) => void;
    if (ch === 'telegram') {
      setter = setPushingTelegram;
    } else if (ch === 'wecom') {
      setter = setPushingWeCom;
    } else {
      setter = setPushingEmail;
    }
    
    setter(true);
    const token = await getToken();
    if (!token) { setter(false); return; }

    let endpoint = '/api/push-now';
    let urlWithParams = `${endpoint}?channel=${ch}`;

    try {
      const res = await fetch(urlWithParams, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
      });
      const data = await res.json();
      if (res.ok) alert(`推送成功！已发送 ${data.itemCount || data.itemsCount || 0} 条信息`);
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

      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50 overflow-x-hidden">
        <div className="container mx-auto px-3 sm:px-4 py-4 flex justify-between items-center max-w-full">
          <Link href="/" className="text-xl font-semibold text-gray-900">📡 Info Radar</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-sm text-gray-400 truncate max-w-[120px] sm:max-w-none hidden sm:inline">{user?.email}</span>
            <Link href="/history">
              <Button variant="ghost" size="sm">推送历史</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>退出</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 max-w-4xl w-full">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">欢迎回来</h2>
          <p className="text-gray-500">管理你的 RSS 订阅源，接收定时推送</p>
        </div>

        {/* 推送渠道卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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
                <Button variant="outline" onClick={() => router.push('/settings?tab=telegram')} className="w-full">管理配置</Button>
              </div>
            ) : (
              <Button onClick={() => router.push('/settings?tab=telegram')} className="w-full">绑定 Telegram</Button>
            )}
          </div>
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
                <Button variant="outline" onClick={() => router.push('/settings?tab=wecom')} className="w-full">管理配置</Button>
              </div>
            ) : (
              <Button onClick={() => router.push('/settings?tab=wecom')} className="w-full bg-green-500 hover:bg-green-600">绑定企业微信</Button>
            )}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">📧</div>
              <div>
                <h3 className="font-semibold text-gray-900">邮件推送</h3>
                <p className="text-xs text-gray-500">{emailStatus.verified ? '✓ 已验证' : '未验证'}</p>
              </div>
            </div>
            {emailStatus.verified ? (
              <div className="space-y-3">
                <Button 
                  onClick={() => handlePush('email')} 
                  disabled={pushingEmail || feeds.length === 0 || !emailStatus.verified} 
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  {pushingEmail ? '推送中...' : '立即推送'}
                </Button>
                <Button variant="outline" onClick={() => router.push('/settings?tab=email')} className="w-full">管理配置</Button>
              </div>
            ) : (
              <Button onClick={() => router.push('/settings?tab=email')} className="w-full bg-purple-500 hover:bg-purple-600">绑定邮箱</Button>
            )}
          </div>
        </div>

        {/* 我的 RSS 源 - 统一管理 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">我的 RSS 源</h3>
              <p className="text-xs text-gray-400 mt-1">管理你的数据源，支持拖拽排序</p>
            </div>
            <Button onClick={openAddDialog} className="text-sm">
              + 添加自定义源
            </Button>
          </div>

          {feeds.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📡</div>
              <p className="text-gray-400">还没有 RSS 源</p>
            </div>
          ) : feeds.length > 0 ? (
            <Reorder.Group axis="y" values={feeds} onReorder={handleReorder} className="space-y-3" as="div">
              {feeds.map((feed) => (
                <FeedItem
                  key={feed.id}
                  feed={feed}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteFeed}
                  onToggle={handleToggleEnabled}
                  onPushLimitChange={handlePushLimitChange}
                />
              ))}
            </Reorder.Group>
          ) : null}
        </div>
      </main>
      <FeedDialog
        open={dialogOpen}
        mode={dialogMode}
        initialUrl={dialogUrl}
        initialName={dialogName}
        onClose={closeDialog}
        onSubmit={handleDialogSubmit}
      />

    </div>
  );
}
