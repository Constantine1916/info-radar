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



  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Head>
        <title>Info Radar - 打破信息差</title>
        <meta name="description" content="个人信息雷达系统 - 智能信息聚合，多渠道推送" />
      </Head>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20 page-enter">
            <div className="inline-block mb-8">
              <span className="text-6xl">📡</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-4 tracking-tight">
              Info Radar
            </h1>
            <p className="text-xl text-gray-500 mb-2 font-normal">
              打破信息差
            </p>
            <p className="text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
              聚合全网 RSS 信息源，支持 Telegram、企业微信、邮件多渠道推送
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-20">
            <Link href="/auth/signup">
              <button className="px-8 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                立即开始
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="px-8 py-3 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium transition-all duration-300">
                登录
              </button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 p-8 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">RSS 订阅管理</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                内置热门信息源，支持添加自定义 RSS，自由管理订阅列表
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-8 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">多渠道推送</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                支持 Telegram、企业微信、邮件推送，随时随地接收信息
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-8 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300">⏰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">定时推送</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                每日早上 9 点自动推送，也可随时手动推送最新内容
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 text-center">
            <a
              href="https://github.com/Constantine1916/info-radar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm group"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}