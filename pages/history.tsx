import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { formatDate } from '../lib/utils';
import { getPushItemKey, getPushItemLikeStateKey } from '../lib/push-item-likes';

interface PushItem {
  title: string;
  link: string;
  source: string;
}

interface PushRecord {
  id: string;
  items_count: number;
  domains: string[];
  sent_at: string;
  success: boolean;
  items: PushItem[] | null;
}

interface IndexedPushItem extends PushItem {
  itemIndex: number;
  itemKey: string;
}

export default function History() {
  const handleSignOut = async () => {
    await signOut();
    router.push('/landing');
  };

  const { user, session, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PushRecord[]>([]);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [likedItemKeys, setLikedItemKeys] = useState<Set<string>>(new Set());
  const [pendingLikeKeys, setPendingLikeKeys] = useState<Set<string>>(new Set());
  const [likeError, setLikeError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      fetchHistory();
    }
  }, [user, authLoading, router]);

  const fetchHistory = async () => {
    if (!supabase || !user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('push_history')
      .select('id, items_count, domains, sent_at, success, items')
      .eq('user_id', user!.id)
      .order('sent_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      const records = data as PushRecord[];
      setHistory(records);
      await fetchLikes(records.map(record => record.id));
    }
    setLoading(false);
  };

  const getAccessToken = async () => {
    if (session?.access_token) return session.access_token;
    if (!supabase) return null;

    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const fetchLikes = async (pushIds: string[]) => {
    if (pushIds.length === 0) {
      setLikedItemKeys(new Set());
      return;
    }

    const token = await getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/history-likes?push_ids=${encodeURIComponent(pushIds.join(','))}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch likes');

      const nextLikedKeys = new Set<string>(
        (data.likes || []).map((like: { push_history_id: string; item_key: string }) =>
          getPushItemLikeStateKey(like.push_history_id, like.item_key)
        )
      );
      setLikedItemKeys(nextLikedKeys);
    } catch (error) {
      console.error('Failed to fetch likes:', error);
      setLikeError('点赞状态加载失败，请刷新后重试');
    }
  };

  const toggleLike = async (record: PushRecord, item: IndexedPushItem) => {
    const token = await getAccessToken();
    if (!token) {
      setLikeError('登录状态已过期，请重新登录');
      return;
    }

    const stateKey = getPushItemLikeStateKey(record.id, item.itemKey);
    const nextLiked = !likedItemKeys.has(stateKey);
    setLikeError(null);

    setLikedItemKeys(prev => {
      const next = new Set(prev);
      if (nextLiked) next.add(stateKey);
      else next.delete(stateKey);
      return next;
    });
    setPendingLikeKeys(prev => {
      const next = new Set(prev);
      next.add(stateKey);
      return next;
    });

    try {
      const response = await fetch('/api/history-likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          push_history_id: record.id,
          item_key: item.itemKey,
          liked: nextLiked,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update like');

      setLikedItemKeys(prev => {
        const next = new Set(prev);
        if (data.liked) next.add(stateKey);
        else next.delete(stateKey);
        return next;
      });
    } catch (error) {
      console.error('Failed to update like:', error);
      setLikedItemKeys(prev => {
        const next = new Set(prev);
        if (nextLiked) next.delete(stateKey);
        else next.add(stateKey);
        return next;
      });
      setLikeError('点赞保存失败，请稍后重试');
    } finally {
      setPendingLikeKeys(prev => {
        const next = new Set(prev);
        next.delete(stateKey);
        return next;
      });
    }
  };

  const toggleRecord = (id: string) => {
    setExpandedRecord(expandedRecord === id ? null : id);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center page-enter">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] page-enter">
      <Head>
        <title>推送历史 - Info Radar</title>
      </Head>

      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/home" className="flex items-center gap-3 group">
            <span className="text-2xl">📡</span>
            <span className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">Info Radar</span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Link href="/home">
              <Button variant="ghost" size="sm">返回首页</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-gray-100">退出</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">推送历史</h2>
          <p className="text-gray-500">查看过去的推送记录和内容</p>
          {likeError && <p className="text-sm text-red-500 mt-2">{likeError}</p>}
        </div>

        {history.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600 mb-2 text-lg font-medium">还没有推送记录</p>
            <p className="text-sm text-gray-400">配置订阅后，每天会自动推送</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record) => {
              const isExpanded = expandedRecord === record.id;
              const items = record.items || [];
              const indexedItems = items.map((item, index) => ({
                ...item,
                itemIndex: index,
                itemKey: getPushItemKey(item, index),
              }));

              // 按源分组
              const grouped: Record<string, IndexedPushItem[]> = {};
              indexedItems.forEach(item => {
                if (!grouped[item.source]) grouped[item.source] = [];
                grouped[item.source].push(item);
              });

              return (
                <div key={record.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg">
                  <div
                    onClick={() => toggleRecord(record.id)}
                    className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        record.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {record.success ? '✓' : '✗'}
                      </span>
                      <div>
                        <span className="font-semibold text-gray-900 text-lg">{formatDate(record.sent_at)}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{record.items_count} 条信息 · {record.domains.length} 个源</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {record.domains.slice(0, 4).map((domain) => (
                          <span key={domain} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            📌 {domain}
                          </span>
                        ))}
                        {record.domains.length > 4 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-400 rounded-full text-xs">
                            +{record.domains.length - 4}
                          </span>
                        )}
                      </div>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-50 px-6 py-4">
                      {items.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-4">该记录无详细内容（旧数据）</p>
                      ) : (
                        Object.entries(grouped).map(([source, sourceItems]) => (
                          <div key={source} className="mb-4 last:mb-0">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">📌 {source} ({sourceItems.length})</h4>
                            <div className="space-y-1.5 pl-2">
                              {sourceItems.map((item, i) => {
                                const stateKey = getPushItemLikeStateKey(record.id, item.itemKey);
                                const isLiked = likedItemKeys.has(stateKey);
                                const isPending = pendingLikeKeys.has(stateKey);

                                return (
                                  <div key={item.itemKey} className="flex items-start gap-2.5 py-1.5 group">
                                    <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500 mt-0.5">
                                      {i + 1}
                                    </span>
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="min-w-0 flex-1 text-sm text-gray-700 group-hover:text-blue-600 transition-colors leading-relaxed line-clamp-2"
                                    >
                                      {item.title}
                                    </a>
                                    <button
                                      type="button"
                                      aria-label={isLiked ? '取消点赞' : '点赞'}
                                      aria-pressed={isLiked}
                                      disabled={isPending}
                                      onClick={() => toggleLike(record, item)}
                                      className={`flex-shrink-0 rounded-full p-1 transition-all active:scale-90 disabled:cursor-wait disabled:opacity-60 ${
                                        isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-300 hover:text-gray-400'
                                      }`}
                                    >
                                      <Heart className="h-4 w-4" strokeWidth={2.2} fill={isLiked ? 'currentColor' : 'none'} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
