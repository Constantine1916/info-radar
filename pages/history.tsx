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
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
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

  const toggleSummary = (itemId: string) => {
    const newExpanded = new Set(expandedSummaries);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedSummaries(newExpanded);
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

        if (expandedRecord) {
          const record = history.find(r => r.id === expandedRecord);
          if (record) {
            await fetchRecordItems(record);
          }
        }
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

      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <span className="text-2xl">📡</span>
            <span className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">Info Radar</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/hot" className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5">
              <span>🔥</span>
              <span>热门</span>
            </Link>
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="hover:bg-gray-100">退出</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">推送历史</h2>
          <p className="text-gray-500">查看过去30天的推送记录</p>
        </div>

        {history.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600 mb-2 text-lg font-medium">还没有推送记录</p>
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
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
                >
                  {/* Record Header */}
                  <div
                    onClick={() => toggleRecord(record)}
                    className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        record.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {record.success ? '✓' : '✗'}
                      </span>
                      <div>
                        <span className="font-semibold text-gray-900 text-lg">
                          {formatDate(record.sent_at)}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {record.items_count} 条信息
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {record.domains.map((domain) => {
                          const info = DOMAINS[domain as keyof typeof DOMAINS];
                          return (
                            <span
                              key={domain}
                              className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                            >
                              {info?.emoji} {info?.name}
                            </span>
                          );
                        })}
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Items */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 divide-y divide-gray-50/50">
                      {items.length === 0 ? (
                        <div className="px-6 py-8 text-center">
                          <div className="text-gray-400 text-sm">加载中...</div>
                        </div>
                      ) : (
                        items.map((item, index) => (
                          <div
                            key={item.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            {/* Main link */}
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-6 py-4"
                            >
                              <div className="flex items-start gap-4">
                                <span className="flex-shrink-0 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium">
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm text-gray-900 leading-relaxed line-clamp-2 font-medium">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
                                    <span>{item.source}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-amber-500">⭐ {item.credibility_score}</span>
                                  </p>
                                </div>
                              </div>
                            </a>

                            {/* Summary */}
                            <div className="px-6 pb-4 pl-16">
                              {item.ai_summary ? (
                                <div
                                  onClick={() => toggleSummary(item.id)}
                                  className="text-sm text-gray-600 leading-relaxed cursor-pointer hover:text-gray-900 transition-colors"
                                >
                                  <span className="text-xs text-gray-400 uppercase tracking-wider mr-2">📝 AI 摘要</span>
                                  {expandedSummaries.has(item.id)
                                    ? item.ai_summary
                                    : item.ai_summary.length > 80
                                      ? item.ai_summary.slice(0, 80) + '...'
                                      : item.ai_summary}
                                  <span className="text-xs text-gray-400 ml-2">
                                    {expandedSummaries.has(item.id) ? '收起' : '展开'}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateSummary(item.id);
                                  }}
                                  disabled={generatingSummaries.has(item.id)}
                                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                                >
                                  <span>{generatingSummaries.has(item.id) ? '生成中...' : '📝'}</span>
                                  <span>{generatingSummaries.has(item.id) ? '' : '点击生成摘要'}</span>
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
