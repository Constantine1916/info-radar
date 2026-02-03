import { InfoItem } from '../types';

export class InfoFilter {
  /**
   * 基础关键词过滤（MVP版本）
   * 后续会接入AI做智能过滤
   */
  filter(items: InfoItem[]): InfoItem[] {
    console.log(`\n🔍 Filtering ${items.length} items...`);
    
    // 过滤规则
    const filtered = items.filter(item => {
      // 1. 过滤标题党
      if (this.isClickbait(item.title)) {
        console.log(`  ❌ Clickbait filtered: ${item.title}`);
        return false;
      }
      
      // 2. 过滤太旧的信息（7天前）
      const daysSince = (Date.now() - item.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) {
        return false;
      }
      
      // 3. 基本质量检查
      if (item.title.length < 10 || !item.link) {
        return false;
      }
      
      return true;
    });
    
    console.log(`  ✅ Filtered down to ${filtered.length} items`);
    return filtered;
  }
  
  /**
   * 按领域分组
   */
  groupByDomain(items: InfoItem[]): Map<string, InfoItem[]> {
    const grouped = new Map<string, InfoItem[]>();
    
    items.forEach(item => {
      const existing = grouped.get(item.domain) || [];
      grouped.set(item.domain, [...existing, item]);
    });
    
    return grouped;
  }
  
  /**
   * 识别标题党
   */
  private isClickbait(title: string): boolean {
    const clickbaitKeywords = [
      '震惊', '吓死', '不看后悔', '必看', '颠覆', '秒杀',
      '暴涨', '暴跌', '翻倍', '绝密', '内幕'
    ];
    
    return clickbaitKeywords.some(keyword => title.includes(keyword));
  }
}
