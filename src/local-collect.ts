#!/usr/bin/env node
import 'dotenv/config';
import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { DOMAINS, DOMAIN_CONFIG, DataSource } from './lib/types';

const parser = new Parser({ timeout: 10000 }); // 10秒超时

// 数据源配置
const RSS_SOURCES: DataSource[] = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', type: 'rss', domain: 'AI', credibility: 4 },
  { name: 'Arxiv AI', url: 'http://export.arxiv.org/rss/cs.AI', type: 'rss', domain: 'AI', credibility: 5 },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', type: 'rss', domain: 'AI', credibility: 5 },
  { name: 'Next.js Blog', url: 'https://nextjs.org/feed.xml', type: 'rss', domain: 'FullStack', credibility: 5 },
  { name: 'Vercel Blog', url: 'https://vercel.com/atom', type: 'rss', domain: 'FullStack', credibility: 4 },
  { name: '36氪', url: 'https://36kr.com/feed', type: 'rss', domain: 'Investment', credibility: 3 },
  { name: '少数派', url: 'https://sspai.com/feed', type: 'rss', domain: 'Productivity', credibility: 4 },
];

function generateId(link: string): string {
  return createHash('md5').update(link).digest('hex').substring(0, 16);
}

async function collectSource(source: DataSource) {
  const start = Date.now();
  try {
    const feed = await parser.parseURL(source.url);
    const items = feed.items.map(item => ({
      id: generateId(item.link || item.guid || ''),
      title: item.title || 'Untitled',
      link: item.link || '',
      content: item.contentSnippet || item.content || '',
      source: source.name,
      domain: source.domain,
      published_at: item.pubDate || new Date().toISOString(),
      collected_at: new Date().toISOString(),
      credibility_score: source.credibility,
    }));
    const time = Date.now() - start;
    console.log(`  ✅ ${source.name}: ${items.length} 条 (${time}ms)`);
    return items;
  } catch (error) {
    const time = Date.now() - start;
    console.log(`  ❌ ${source.name}: 失败 (${time}ms) - ${(error as Error).message}`);
    return [];
  }
}

async function main() {
  console.log('🚀 Info Radar 采集开始...\n');
  
  const start = Date.now();
  
  // 并行采集（最多同时5个）
  const batchSize = 5;
  const allItems: any[] = [];
  
  for (let i = 0; i < RSS_SOURCES.length; i += batchSize) {
    const batch = RSS_SOURCES.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(s => collectSource(s)));
    
    results
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .forEach(item => allItems.push(item));
  }
  
  console.log(`\n📊 总计采集: ${allItems.length} 条 (${Date.now() - start}ms)`);
  console.log('\n🎉 完成!');
}

main().catch(console.error);
