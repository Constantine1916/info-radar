import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';


interface HotItem {
  id: string;
  title: string;
  link: string;
  source: string;
  credibility_score: number;
  published_at: string;
  ai_summary: string | null;
}

interface DomainData {
  key: string;
  name: string;
  emoji: string;
  description: string;
  count: number;
  items: HotItem[];
}

export default function Hot() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [generatingSummaries, setGeneratingSummaries] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      fetchHotItems();
    }
  }, [user, authLoading, router]);

  const fetchHotItems = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/hot', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setDomains(data.domains);
        if (data.domains.length > 0) {
          setExpandedDomain(data.domains[0].key);
        }
      }
    } catch (error) {
      console.error('Failed to fetch hot items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSummary = async (itemId: string) => {
    const newExpanded = new Set(expandedSummaries);
    
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
      setExpandedSummaries(newExpanded);
      return;
    }

    newExpanded.add(itemId);
    setExpandedSummaries(newExpanded);

    // If no summary and not generating, fetch it
    const item = domains.flatMap(d => d.items).find(i => i.id === itemId);
    if (item && !item.ai_summary && !generatingSummaries.has(itemId)) {
      await generateSummary(itemId);
    }
  };

  const generateSummary = async (itemId: string) => {
    if (!supabase) return;
    
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
        setDomains(prev => prev.map(d => ({
          ...d,
          items: d.items.map(item =>
            item.id === itemId
              ? { ...item, ai_summary: data.summary }
              : item
          ),
        })));
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      newGenerating.delete(itemId);
      setGeneratingSummaries(newGenerating);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    return '刚刚';
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
        <title>热门内容 - Info Radar</title>
      </Head>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="text-xl">📡</span>
            <span className="text-xl font-medium text-gray-900">Info Radar</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              订阅配置
            </Link>
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>退出</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">🔥 热门内容</h1>
          <p className="text-gray-500">为你精选各领域最受关注的资讯</p>
        </div>

        {/* Domain Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {domains.map((domain) => (
            <button
              key={domain.key}
              onClick={() => setExpandedDomain(expandedDomain === domain.key ? null : domain.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                expandedDomain === domain.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {domain.emoji} {domain.name}
              <span className="ml-2 opacity-60">({domain.count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {domains.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600 mb-2">还没有订阅任何领域</p>
            <p className="text-sm text-gray-400 mb-4">去订阅你感兴趣的内容吧</p>
            <Link href="/dashboard">
              <Button>去订阅</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {domains
              .filter(d => expandedDomain === null || expandedDomain === d.key)
              .map((domain) => (
                <div
                  key={domain.key}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                >
                  {/* Domain Header */}
                  <div
                    onClick={() => setExpandedDomain(expandedDomain === domain.key ? null : domain.key)}
                    className="px-6 py-4 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{domain.emoji}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{domain.name}</h3>
                        <p className="text-xs text-gray-500">{domain.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">{domain.items.length} 条热门</span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedDomain === domain.key ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Items List */}
                  {(expandedDomain === domain.key) && (
                    <div className="divide-y divide-gray-50">
                      {domain.items.map((item, index) => {
                        const isExpanded = expandedSummaries.has(item.id);
                        const isGenerating = generatingSummaries.has(item.id);

                        return (
                          <div
                            key={item.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            {/* Main content - clickable link */}
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-6 py-4"
                            >
                              <div className="flex items-start gap-4">
                                {/* Number */}
                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  index < 3
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {index + 1}
                                </span>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 leading-relaxed line-clamp-2 mb-2">
                                    {item.title}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{item.source}</span>
                                    <span>•</span>
                                    <span>{formatTime(item.published_at)}</span>
                                    <span>•</span>
                                    <span className={`${
                                      item.credibility_score >= 4
                                        ? 'text-green-600'
                                        : item.credibility_score >= 3
                                        ? 'text-yellow-600'
                                        : 'text-gray-500'
                                    }`}>
                                      ⭐ {item.credibility_score}
                                    </span>
                                  </div>
                                </div>

                                {/* Arrow */}
                                <svg
                                  className="flex-shrink-0 w-4 h-4 text-gray-400 mt-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </a>

                            {/* Summary section */}
                            <div className="px-6 pb-4 pl-14">
                              {item.ai_summary ? (
                                <div 
                                  onClick={() => toggleSummary(item.id)}
                                  className="text-sm text-gray-600 leading-relaxed cursor-pointer hover:text-gray-900 transition-colors"
                                >
                                  <span className="text-xs text-gray-400 uppercase tracking-wide mr-2">📝 AI 摘要</span>
                                  {isExpanded ? item.ai_summary : item.ai_summary.slice(0, 60) + '...'}
                                  <span className="text-xs text-gray-400 ml-2">
                                    {isExpanded ? '收起' : '展开'}
                                  </span>
                                </div>
                              ) : isGenerating ? (
                                <button
                                  onClick={() => generateSummary(item.id)}
                                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  生成摘要中...
                                </button>
                              ) : (
                                <button
                                  onClick={() => generateSummary(item.id)}
                                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  📝 点击生成 AI 摘要
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            数据来源：RSS 订阅源
          </p>
        </div>
      </main>
    </div>
  );
}
