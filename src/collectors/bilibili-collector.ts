import axios from 'axios';
import * as cheerio from 'cheerio';
import { InfoItem, DataSource } from '../types';

export class BilibiliCollector {
  async collect(source: DataSource): Promise<InfoItem[]> {
    try {
      console.log(`📡 Collecting from Bilibili: ${source.name}`);
      
      const { data } = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com/'
        }
      });
      
      const $ = cheerio.load(data);
      const items: InfoItem[] = [];
      
      // 热门排行榜解析
      $('.video-card').each((_, el) => {
        const title = $(el).find('.title').text().trim();
        const link = $(el).find('a').attr('href');
        const desc = $(el).find('.desc').text().trim();
        const author = $(el).find('.author').text().trim();
        
        if (title && link) {
          items.push({
            id: this.generateId(link),
            title,
            link: 'https:' + link,
            content: desc || title,
            source: source.name,
            domain: source.domain || 'Entertainment',
            publishedAt: new Date(),
            collectedAt: new Date(),
            credibilityScore: source.credibility || 3
          });
        }
      });
      
      console.log(`  ✅ Collected ${items.length} items from ${source.name}`);
      return items;
    } catch (error) {
      console.error(`  ❌ Failed to collect from ${source.name}:`, error);
      return [];
    }
  }
  
  private generateId(link: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(link).digest('hex').substring(0, 16);
  }
}
