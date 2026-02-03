import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { formatDate } from '../lib/utils';
import { DOMAINS } from '../lib/types';

interface PushRecord {
  id: string;
  items_count: number;
  domains: string[];
  sent_at: string;
  success: boolean;
}

interface HistoryItem {
  id: string;
  title: string;
  link: string;
  source: string;
  credibility_score: number;
  published_at: string;
  ai_summary: string | null;
}

export default function History() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PushRecord[]>([]);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [recordItems, setRecordItems] = useState<Record<string, HistoryItem[]>>({});
  const [generatingSummaries, setGeneratingSummaries] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      fetchHistory();
    }
  }, [user, authLoading, router]);

  const fetchHistory = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const { data, error } = await supabase
      .from('push_history')
      .select('*')
      .eq('user_id', user!.id)
      .order('sent_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const fetchRecordItems = async (record: PushRecord) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const res = await fetch('/api/history-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        domains: record.domains,
        sent_at: record.sent_at,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setRecordItems(prev => ({
        ...prev,
        [record.id]: data.items,
      }));
    }
  };

  const toggleRecord = (record: PushRecord) => {
    if (expandedRecord === record.id) {
      setExpandedRecord(null);
    } else {
      setExpandedRecord(record.id);
      if (!recordItems[record.id]) {
        fetchRecordItems(record);
      }
    }
  };

  const generateSummary = async (itemId: string) => {
    const newGenerating = new Set(generatingSummaries);
    newGenerating.add(itemId);
    setGeneratingSummaries(newGenerating);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ item_id: itemId }),
      });

      const data = await res.json();
      if (data.success) {
        setRecordItems(prev => ({
          ...prev,
          [expandedRecord!]: (prev[expandedRecord!] || []).map(item =>
            item.id === itemId ? { ...item, ai_summary: data.summary } : item
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      newGenerating.delete(itemId);
      setGeneratingSummaries(newGenerating);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-4">📊</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Head>
        <title>推送历史 - Info Radar</title>
      </Head>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="text-xl">📡</span>
            <span className="text-xl font-medium text-gray-900">Info Radar</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/hot" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              🔥 热门
            </Link>
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>退出</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h2 className="text-xl font-medium text-gray-900 mb-1">推送历史</h2>
          <p className="text-sm text-gray-500">查看过去30天的推送记录</p>
        </div>

        {history.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-gray-600 mb-1">还没有推送记录</p>
            <p className="text-sm text-gray-400">
              配置订阅后，每天早上9点会自动推送
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record) => {
              const items = recordItems[record.id] || [];
              const isExpanded = expandedRecord === record.id;

              return (
                <div
                  key={record.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                >
                  {/* Record Header */}
                  <div
                    onClick={() => toggleRecord(record)}
                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={record.success ? 'text-green-600' : 'text-red-600'}>
                        {record.success ? '✓' : '✗'}
                      </span>
                      <div>
                        <span className="font-medium text-gray-900">
                          {formatDate(record.sent_at)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {record.items_count} 条信息
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-1">
                        {record.domains.map((domain) => {
                          const info = DOMAINS[domain as keyof typeof DOMAINS];
                          return (
                            <span
                              key={domain}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                            >
                              {info?.emoji} {info?.name}
                            </span>
                          );
                        })}
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Items */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 divide-y divide-gray-50">
                      {items.length === 0 ? (
                        <div className="px-5 py-4 text-center text-gray-400 text-sm">
                          加载中...
                        </div>
                      ) : (
                        items.map((item, index) => (
                          <div
                            key={item.id}
                            className="hover:bg-gray-50/30 transition-colors"
                          >
                            {/* Main link */}
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-5 py-3"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-600">
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm text-gray-900 leading-relaxed line-clamp-2">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {item.source} • ⭐ {item.credibility_score}
                                  </p>
                                </div>
                              </div>
                            </a>

                            {/* Summary */}
                            <div className="px-5 pb-3 pl-11">
                              {item.ai_summary ? (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  📝 {item.ai_summary}
                                </p>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateSummary(item.id);
                                  }}
                                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  📝 点击生成摘要
                                </button>
                              )}
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
