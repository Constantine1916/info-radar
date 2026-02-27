import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

type Tab = 'telegram' | 'wecom';

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('telegram');
  
  // Telegram state
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [currentChatId, setCurrentChatId] = useState('');
  const [verified, setVerified] = useState(false);
  
  // WeCom state
  const [webhookKey, setWebhookKey] = useState('');
  const [hasWebhook, setHasWebhook] = useState(false);
  
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
      loadWebhookConfig();
    }
  }, [user]);

  async function loadBotConfig() {
    if (!supabase) return;
    
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

  async function loadWebhookConfig() {
    if (!supabase) return;
    
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/webhook/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasWebhook(data.hasWebhook);
      }
    } catch (error) {
      console.error('Failed to load webhook config:', error);
    }
  }

  async function handleSaveTelegram() {
    if (!supabase) return;
    
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

  async function handleRemoveTelegram() {
    if (!supabase) return;
    
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

  async function handleSaveWebhook() {
    if (!supabase) return;
    
    if (!webhookKey) {
      setMessage('请填写企业微信 Webhook');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/webhook/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ webhookKey }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('配置成功！');
        setWebhookKey('');
        await loadWebhookConfig();
      } else {
        setMessage(data.error || '配置失败');
      }
    } catch (error) {
      setMessage('网络错误');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveWebhook() {
    if (!supabase) return;
    
    if (!confirm('确定要移除 Webhook 配置吗？')) return;

    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/webhook/config', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage('已移除 Webhook 配置');
        await loadWebhookConfig();
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
        <title>推送设置 - Info Radar</title>
      </Head>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/home" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-600 group-hover:text-gray-900 transition-colors">返回</span>
          </Link>
          <Link href="/home" className="text-xl font-semibold text-gray-900">
            📡 Info Radar
          </Link>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-lg">
        <h2 className="text-3xl font-semibold text-gray-900 mb-8">推送设置</h2>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'telegram'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📱 Telegram
          </button>
          <button
            onClick={() => setActiveTab('wecom')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'wecom'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            💼 企业微信
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 text-sm rounded-xl transition-all duration-300 ${
            message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Telegram Tab */}
        {activeTab === 'telegram' && (
          <>
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
                  <p className="text-green-800 font-semibold">Telegram Bot 已配置</p>
                </div>
                <p className="text-green-700 text-sm mb-4">Chat ID: <span className="font-mono bg-green-100 px-2 py-0.5 rounded">{currentChatId}</span></p>
                <Button
                  variant="outline"
                  onClick={handleRemoveTelegram}
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

                <Button onClick={handleSaveTelegram} disabled={saving} className="w-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  {saving ? '保存中...' : '保存配置'}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* WeCom Tab */}
        {activeTab === 'wecom' && (
          <>
            {/* How to guide */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 hover:shadow-lg transition-all duration-300">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span>
                <span>如何配置？</span>
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600">
                <li>打开企业微信，进入群聊</li>
                <li>点击群设置 → 添加群机器人</li>
                <li>创建新机器人，复制 webhook URL</li>
                <li>URL 格式: <code className="bg-gray-100 px-2 py-0.5 rounded-lg text-xs">https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx</code></li>
                <li>填写下方表单保存</li>
              </ol>
            </div>

            {/* Current status */}
            {hasWebhook && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">✅</span>
                  <p className="text-green-800 font-semibold">企业微信 Webhook 已配置</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleRemoveWebhook}
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
                <span>{hasWebhook ? '更新配置' : '配置 Webhook'}</span>
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <Input
                    type="text"
                    value={webhookKey}
                    onChange={(e) => setWebhookKey(e.target.value)}
                    placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
                  />
                </div>

                <Button onClick={handleSaveWebhook} disabled={saving} className="w-full bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  {saving ? '保存中...' : '保存配置'}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
