import Parser from 'rss-parser';
import { InfoItem, DataSource } from '../types';
import { createHash } from 'crypto';

const parser = new Parser();

export class RSSCollector {
  async collect(source: DataSource): Promise<InfoItem[]> {
    try {
      console.log(`📡 Collecting from ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      
      const items: InfoItem[] = feed.items.map(item => ({
        id: this.generateId(item.link || item.guid || ''),
        title: item.title || 'Untitled',
        link: item.link || '',
        content: item.contentSnippet || item.content || '',
        source: source.name,
        domain: source.domain,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        collectedAt: new Date(),
        credibilityScore: source.credibility
      }));
      
      console.log(`  ✅ Collected ${items.length} items from ${source.name}`);
      return items;
    } catch (error) {
      console.error(`  ❌ Failed to collect from ${source.name}:`, error);
      return [];
    }
  }
  
  async collectAll(sources: DataSource[]): Promise<InfoItem[]> {
    const results = await Promise.allSettled(
      sources.map(source => this.collect(source))
    );
    
    const allItems = results
      .filter((r): r is PromiseFulfilledResult<InfoItem[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);
      
    console.log(`\n📊 Total collected: ${allItems.length} items`);
    return allItems;
  }
  
  private generateId(link: string): string {
    return createHash('md5').update(link).digest('hex').substring(0, 16);
  }
}
