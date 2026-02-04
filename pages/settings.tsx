import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [currentChatId, setCurrentChatId] = useState('');
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadBotConfig();
    }
  }, [user]);

  async function loadBotConfig() {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/bot/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasToken(data.hasToken);
        setCurrentChatId(data.chatId || '');
        setVerified(data.verified);
      }
    } catch (error) {
      console.error('Failed to load bot config:', error);
    }
  }

  async function handleSave() {
    if (!botToken || !chatId) {
      setMessage('请填写 Bot Token 和 Chat ID');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/bot/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ botToken, chatId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`配置成功！Bot: @${data.botUsername}`);
        setBotToken('');
        setChatId('');
        await loadBotConfig();
      } else {
        setMessage(data.error || '配置失败');
      }
    } catch (error) {
      setMessage('网络错误');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm('确定要移除 Bot 配置吗？')) return;

    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/bot/config', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage('已移除 Bot 配置');
        await loadBotConfig();
      }
    } catch (error) {
      setMessage('移除失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center page-enter">
          <div className="text-4xl mb-4 animate-pulse">⚙️</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] page-enter">
      <Head>
        <title>Bot 设置 - Info Radar</title>
      </Head>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-600 group-hover:text-gray-900 transition-colors">返回</span>
          </Link>
          <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
            📡 Info Radar
          </Link>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-lg">
        <h2 className="text-3xl font-semibold text-gray-900 mb-8">Telegram Bot 设置</h2>

        {/* How to guide */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 hover:shadow-lg transition-all duration-300">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>如何配置？</span>
          </h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600">
            <li>在 Telegram 中找到 <code className="bg-gray-100 px-2 py-0.5 rounded-lg text-xs">@BotFather</code></li>
            <li>发送 <code className="bg-gray-100 px-2 py-0.5 rounded-lg text-xs">/newbot</code> 创建新 bot</li>
            <li>复制 BotFather 给你的 <strong className="text-gray-900">API Token</strong></li>
            <li>启动 bot，发送任意消息</li>
            <li>访问 <code className="bg-gray-100 px-2 py-0.5 rounded-lg text-xs">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code></li>
            <li>找到 <code className="bg-gray-100 px-2 py-0.5 rounded-lg text-xs">chat.id</code></li>
            <li>填写下方表单保存</li>
          </ol>
        </div>

        {/* Current status */}
        {hasToken && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">✅</span>
              <p className="text-green-800 font-semibold">Bot 已配置</p>
            </div>
            <p className="text-green-700 text-sm mb-4">Chat ID: <span className="font-mono bg-green-100 px-2 py-0.5 rounded">{currentChatId}</span></p>
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={saving}
              className="text-red-600 hover:bg-red-50 border-red-200 transition-all hover:shadow-md"
            >
              移除配置
            </Button>
          </div>
        )}

        {/* Config form */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span>⚙️</span>
            <span>{hasToken ? '更新配置' : '配置 Bot'}</span>
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <Input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdef..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chat ID
              </label>
              <Input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="123456789"
              />
            </div>

            {message && (
              <div className={`p-4 text-sm rounded-xl transition-all duration-300 ${
                message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
