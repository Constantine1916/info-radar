import { InfoItem } from '../types';

export class DigestGenerator {
  /**
   * 生成每日摘要（Markdown格式，适合Telegram）
   */
  generate(groupedItems: Map<string, InfoItem[]>): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    let digest = `📡 **Info Radar 每日摘要**\n`;
    digest += `📅 ${dateStr}\n\n`;
    digest += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // 统计
    const totalItems = Array.from(groupedItems.values()).reduce((sum, items) => sum + items.length, 0);
    digest += `📊 今日共采集 **${totalItems}** 条高质量信息\n\n`;
    
    // 各领域摘要
    const domainNames = {
      'AI': '🤖 AI/技术趋势',
      'FullStack': '💻 全栈开发',
      'ChinaPolicy': '🇨🇳 中国政策/市场',
      'WorldPolitics': '🌍 世界局势',
      'Investment': '💰 投资/创业'
    };
    
    groupedItems.forEach((items, domain) => {
      const name = domainNames[domain as keyof typeof domainNames] || domain;
      digest += `${name} (${items.length})\n`;
      digest += `${'─'.repeat(30)}\n\n`;
      
      // Top 5
      items.slice(0, 5).forEach((item, i) => {
        digest += `${i + 1}. ${item.title}\n`;
        digest += `   🔗 ${item.link}\n`;
        digest += `   📍 ${item.source} | ⭐ ${item.credibilityScore}/5\n\n`;
      });
      
      if (items.length > 5) {
        digest += `   _...还有 ${items.length - 5} 条_\n\n`;
      }
    });
    
    digest += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    digest += `✅ 自动采集完成 | 💡 by Info Radar`;
    
    return digest;
  }
  
  /**
   * 生成简短摘要（用于通知）
   */
  generateShort(groupedItems: Map<string, InfoItem[]>): string {
    const totalItems = Array.from(groupedItems.values()).reduce((sum, items) => sum + items.length, 0);
    const domains = Array.from(groupedItems.keys()).join(', ');
    
    return `📡 Info Radar: 今日采集 ${totalItems} 条信息\n领域: ${domains}`;
  }
}
