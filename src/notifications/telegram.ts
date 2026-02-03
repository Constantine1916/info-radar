import axios from 'axios';

export class TelegramNotifier {
  private botToken: string;
  private chatId: string;
  
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    
    if (!this.botToken || !this.chatId) {
      console.warn('⚠️  Telegram credentials not configured. Skipping notifications.');
    }
  }
  
  async send(message: string): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.log('📱 [DRY RUN] Would send to Telegram:\n');
      console.log(message);
      return false;
    }
    
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      
      console.log('✅ Sent to Telegram successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send to Telegram:', error);
      return false;
    }
  }
  
  /**
   * 分段发送长消息（Telegram有4096字符限制）
   */
  async sendLong(message: string): Promise<boolean> {
    const MAX_LENGTH = 4000; // 留点余量
    
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
