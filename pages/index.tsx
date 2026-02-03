import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router, mounted]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Head>
        <title>Info Radar - 打破信息差</title>
        <meta name="description" content="个人信息雷达系统 - 智能信息聚合，精准推送" />
      </Head>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section - Minimalist */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="text-5xl">📡</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium text-gray-900 mb-4 tracking-tight">
              Info Radar
            </h1>
            <p className="text-xl text-gray-500 mb-2 font-normal">
              打破信息差
            </p>
            <p className="text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
              智能聚合全网信息，精准推送到 Telegram，让重要资讯不再错过
            </p>
          </div>

          {/* CTA Buttons - Clean */}
          <div className="flex gap-3 justify-center mb-16">
            <Link href="/auth/signup">
              <button className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                立即开始
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium transition-colors">
                登录
              </button>
            </Link>
          </div>

          {/* Features Grid - Clean Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 p-6 rounded-xl hover:shadow-medium transition-all duration-200">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">个性化订阅</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                选择你关注的领域，AI 智能筛选高质量内容
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-xl hover:shadow-medium transition-all duration-200">
              <div className="text-2xl mb-3">✨</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">智能过滤</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                自动过滤标题党和低质量内容，节省阅读时间
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-xl hover:shadow-medium transition-all duration-200">
              <div className="text-2xl mb-3">📱</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Telegram 推送</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                每日定时推送，第一时间掌握重要信息
              </p>
            </div>
          </div>

          {/* Footer - Minimal */}
          <div className="mt-16 text-center">
            <a
              href="https://github.com/Constantine1916/info-radar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75A9.564 1.026 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
