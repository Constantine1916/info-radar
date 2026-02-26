import { useEffect, useState, useRef, useCallback } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SYSTEM_FEEDS, UserFeed } from '../lib/types';

function CustomFeedItem({ feed, editingId, editName, editUrl, setEditName, setEditUrl, startEdit, cancelEdit, handleSaveEdit, savingEdit, handleDeleteFeed }: {
  feed: UserFeed;
  editingId: string | null;
  editName: string;
  editUrl: string;
  setEditName: (v: string) => void;
  setEditUrl: (v: string) => void;
  startEdit: (feed: UserFeed) => void;
  cancelEdit: () => void;
  handleSaveEdit: () => void;
  savingEdit: boolean;
  handleDeleteFeed: (id: string) => void;
}) {
  const controls = useDragControls();
  const scrollRaf = useRef<number | null>(null);

  const startDrag = (e: React.PointerEvent) => {
    controls.start(e);
    const EDGE = 80;
    const SPEED = 12;
    const onMove = (ev: PointerEvent) => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      const y = ev.clientY;
      const vh = window.innerHeight;
      const scroll = () => {
        if (y < EDGE) {
          window.scrollBy(0, -SPEED);
          scrollRaf.current = requestAnimationFrame(scroll);
        } else if (y > vh - EDGE) {
          window.scrollBy(0, SPEED);
          scrollRaf.current = requestAnimationFrame(scroll);
        }
      };
      scroll();
    };
    const onUp = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <Reorder.Item
      value={feed}
      dragListener={false}
      dragControls={controls}
      className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white list-none"
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      whileDrag={{ boxShadow: "0 8px 25px rgba(0,0,0,0.1)", zIndex: 50 }}
    >
      {editingId === feed.id ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">名称</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">RSS URL</label>
            <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={cancelEdit} className="text-sm">取消</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || !editName || !editUrl} className="text-sm">
              {savingEdit ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div
            className="text-gray-300 hover:text-gray-500 mr-3 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={startDrag}
            title="拖拽排序"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
              <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
              <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{feed.name}</div>
            <div className="text-xs text-gray-400 truncate mt-1">{feed.url}</div>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button onClick={() => startEdit(feed)} className="text-gray-300 hover:text-blue-500 transition-colors" title="编辑">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => handleDeleteFeed(feed.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="删除">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading, signedIn, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feeds, setFeeds] = useState<UserFeed[]>([]);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [addingFeed, setAddingFeed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingSystem, setTogglingSystem] = useState<Set<string>>(new Set());
  const [telegramStatus, setTelegramStatus] = useState<{ verified: boolean; chatId?: string }>({ verified: false });
  const [wecomStatus, setWecomStatus] = useState<{ hasWebhook: boolean }>({ hasWebhook: false });
  const [pushingTelegram, setPushingTelegram] = useState(false);
  const [pushingWeCom, setPushingWeCom] = useState(false);
  const fetchStartedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 判断系统源是否已订阅
  const isSystemFeedSubscribed = (url: string) => feeds.some(f => f.url === url);
  // 判断一个 feed 是否是系统源
  const isSystemFeed = (url: string) => SYSTEM_FEEDS.some(sf => sf.url === url);
  // 用户自定义源（排除系统源）
  const customFeeds = feeds.filter(f => !isSystemFeed(f.url));

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
        fetch('/api/feeds', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bot/config', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/webhook/config', { headers: { Authorization: `Bearer ${token}` } }),
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

  const handleToggleSystemFeed = async (sf: { name: string; url: string }) => {
    const token = await getToken();
    if (!token) return;

    setTogglingSystem(prev => new Set(prev).add(sf.url));

    const existing = feeds.find(f => f.url === sf.url);
    try {
      if (existing) {
        // 取消订阅：删除
        const res = await fetch('/api/feeds', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: existing.id }),
        });
        if (res.ok) setFeeds(prev => prev.filter(f => f.id !== existing.id));
      } else {
        // 订阅：添加
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: sf.name, url: sf.url }),
        });
        if (res.ok) {
          const data = await res.json();
          setFeeds(prev => [...prev, data.feed]);
        }
      }
    } catch { }
    finally {
      setTogglingSystem(prev => {
        const next = new Set(prev);
        next.delete(sf.url);
        return next;
      });
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setFeeds(prev => prev.filter(f => f.id !== id));
      else alert('删除失败');
    } catch { alert('网络错误'); }
  };

  const startEdit = (feed: UserFeed) => {
    setEditingId(feed.id);
    setEditName(feed.name);
    setEditUrl(feed.url);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditUrl('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName || !editUrl) return;
    setSavingEdit(true);
    const token = await getToken();
    if (!token) { setSavingEdit(false); return; }

    try {
      const res = await fetch('/api/feeds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingId, name: editName, url: editUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeeds(prev => prev.map(f => f.id === editingId ? data.feed : f));
        cancelEdit();
      } else {
        alert(data.error || '保存失败');
      }
    } catch { alert('网络错误'); }
    finally { setSavingEdit(false); }
  };

  const saveOrder = useCallback(async (orderedCustom: UserFeed[]) => {
    const token = await getToken();
    if (!token) return;
    // 系统源排在前面，自定义源排在后面
    const systemInFeeds = feeds.filter(f => isSystemFeed(f.url));
    const allOrdered = [...systemInFeeds, ...orderedCustom];
    const orders = allOrdered.map((f, i) => ({ id: f.id, sort_order: i }));
    try {
      await fetch('/api/feeds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orders }),
      });
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  }, [feeds]);

  const handleReorder = (newCustomFeeds: UserFeed[]) => {
    // 更新 feeds：系统源保持 + 新排序的自定义源
    const systemInFeeds = feeds.filter(f => isSystemFeed(f.url));
    setFeeds([...systemInFeeds, ...newCustomFeeds]);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveOrder(newCustomFeeds), 500);
  };

  const handlePush = async (ch: 'telegram' | 'wecom') => {
    const setter = ch === 'telegram' ? setPushingTelegram : setPushingWeCom;
    setter(true);
    const token = await getToken();
    if (!token) { setter(false); return; }

    try {
      const res = await fetch(`/api/push-now?channel=${ch}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) alert(`推送成功！已发送 ${data.itemsCount} 条信息`);
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

        {/* 系统默认源 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">默认源</h3>
            <p className="text-xs text-gray-400 mt-1">系统内置数据源，开启后自动纳入推送</p>
          </div>
          <div className="space-y-3">
            {SYSTEM_FEEDS.map((sf) => {
              const subscribed = isSystemFeedSubscribed(sf.url);
              const toggling = togglingSystem.has(sf.url);
              return (
                <div key={sf.url} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{sf.name}</div>
                    <div className="text-xs text-gray-400 truncate mt-1">{sf.url}</div>
                  </div>
                  <button
                    onClick={() => handleToggleSystemFeed(sf)}
                    disabled={toggling}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      subscribed ? 'bg-blue-500' : 'bg-gray-200'
                    } ${toggling ? 'opacity-50' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      subscribed ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 自定义 RSS 源 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">自定义源</h3>
              <p className="text-xs text-gray-400 mt-1">添加你自己的 RSS 源，支持拖拽排序</p>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)} className="text-sm">
              {showAddForm ? '取消' : '+ 添加源'}
            </Button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-5 bg-gray-50 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <Input value={newFeedName} onChange={(e) => setNewFeedName(e.target.value)} placeholder="例如：GitHub Trending" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RSS URL</label>
                <Input value={newFeedUrl} onChange={(e) => setNewFeedUrl(e.target.value)} placeholder="https://example.com/feed.xml" />
              </div>
              <Button onClick={handleAddFeed} disabled={addingFeed || !newFeedName || !newFeedUrl} className="w-full">
                {addingFeed ? '添加中...' : '确认添加'}
              </Button>
            </div>
          )}

          {customFeeds.length === 0 && !showAddForm ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-3">📝</div>
              <p className="text-sm">还没有自定义源，点击上方「+ 添加源」</p>
            </div>
          ) : customFeeds.length > 0 ? (
            <Reorder.Group axis="y" values={customFeeds} onReorder={handleReorder} className="space-y-3" as="div">
              {customFeeds.map((feed) => (
                <CustomFeedItem
                  key={feed.id}
                  feed={feed}
                  editingId={editingId}
                  editName={editName}
                  editUrl={editUrl}
                  setEditName={setEditName}
                  setEditUrl={setEditUrl}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  handleSaveEdit={handleSaveEdit}
                  savingEdit={savingEdit}
                  handleDeleteFeed={handleDeleteFeed}
                />
              ))}
            </Reorder.Group>
          ) : null}
        </div>
      </main>
    </div>
  );
}
