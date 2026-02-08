import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../../lib/types';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface WebhookData {
  webhook_key: string | null;
  webhook_enabled: boolean | null;
}

export class WeComNotifier {
  private webhookUrl: string;
  private supabase: ReturnType<typeof createClient> | null = null;
  
  constructor(webhookKey?: string) {
    // 优先使用传入的 key，其次是环境变量
    const key = webhookKey || process.env.WEBHOOK_KEY || '';
    
    if (key) {
      // 支持完整 URL 或只传 key
      this.webhookUrl = key.includes('key=') 
        ? key 
        : `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`;
    } else {
      this.webhookUrl = '';
    }
    
    // 如果有 Supabase 配置，初始化客户端用于从数据库读取
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    if (!this.webhookUrl && !this.supabase) {
      console.warn('⚠️  Webhook not configured. Skipping notifications.');
    }
  }
  
  /**
   * 从数据库获取用户的 webhook 配置
   */
  async getUserWebhook(userId: string): Promise<string | null> {
    if (!this.supabase) {
      // 没有数据库配置，使用环境变量
      return process.env.WEBHOOK_KEY || null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('webhook_key, webhook_enabled')
        .eq('id', userId)
        .single<WebhookData>();
      
      if (error || !data || !data.webhook_enabled || !data.webhook_key) {
        return null;
      }
      
      return data.webhook_key;
    } catch (error) {
      console.error('Failed to get webhook from database:', error);
      return null;
    }
  }
  
  /**
   * 发送消息（使用指定的用户 webhook）
   */
  async sendToUser(userId: string, message: string): Promise<boolean> {
    const webhookKey = await this.getUserWebhook(userId);
    
    if (!webhookKey) {
      console.log('📱 [DRY RUN] No webhook configured for user:\n');
      console.log(message);
      return false;
    }
    
    const webhookUrl = webhookKey.includes('key=') 
      ? webhookKey 
      : `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${webhookKey}`;
    
    try {
      await axios.post(webhookUrl, {
        msgtype: 'markdown',
        markdown: {
          content: message
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Sent to WeCom successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send to WeCom:', error);
      return false;
    }
  }
  
  async send(message: string): Promise<boolean> {
    if (!this.webhookUrl) {
      console.log('📱 [DRY RUN] Would send to WeCom:\n');
      console.log(message);
      return false;
    }
    
    try {
      await axios.post(this.webhookUrl, {
        msgtype: 'markdown',
        markdown: {
          content: message
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Sent to WeCom successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send to WeCom:', error);
      return false;
    }
  }
  
  /**
   * 发送长消息（企业微信限制约20000字符）
   */
  async sendLong(message: string): Promise<boolean> {
    const MAX_LENGTH = 18000; // 留余量
    
    if (message.length <= MAX_LENGTH) {
      return this.send(message);
    }
    
    // 按领域分割
    const parts = message.split('━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const part of parts) {
      if (part.trim()) {
        await this.send(part.trim());
        await new Promise(resolve => setTimeout(resolve, 1000)); // 避免频率限制
      }
    }
    
    return true;
  }
}
