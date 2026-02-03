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
    return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Head>
        <title>Bot 设置 - Info Radar</title>
      </Head>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-medium text-gray-900">
            📡 Info Radar
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              返回
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <h2 className="text-xl font-medium text-gray-900 mb-6">Telegram Bot 设置</h2>

        {/* How to guide */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">如何配置？</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>在 Telegram 中找到 <code className="bg-gray-100 px-2 py-0.5 rounded">@BotFather</code></li>
            <li>发送 <code className="bg-gray-100 px-2 py-0.5 rounded">/newbot</code> 创建新 bot</li>
            <li>复制 BotFather 给你的 <strong>API Token</strong></li>
            <li>启动 bot，发送任意消息</li>
            <li>访问 <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code></li>
            <li>找到 <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">chat.id</code></li>
            <li>填写下方表单保存</li>
          </ol>
        </div>

        {/* Current status */}
        {hasToken && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
            <p className="text-green-800 font-medium">Bot 已配置</p>
            <p className="text-green-700 text-sm mt-1">Chat ID: {currentChatId}</p>
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={saving}
              className="mt-3 text-red-600 hover:bg-red-50 border-red-200"
            >
              移除配置
            </Button>
          </div>
        )}

        {/* Config form */}
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <h3 className="font-medium text-gray-900 mb-4">
            {hasToken ? '更新配置' : '配置 Bot'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
              <div className={`p-3 text-sm rounded-lg ${
                message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
