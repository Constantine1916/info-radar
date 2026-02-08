import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { createHash } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const parser = new Parser({ timeout: 15000 });

// RSS 数据源
const RSS_SOURCES = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', type: 'rss', domain: 'AI', credibility: 4 },
  { name: 'Arxiv AI', url: 'http://export.arxiv.org/rss/cs.AI', type: 'rss', domain: 'AI', credibility: 5 },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', type: 'rss', domain: 'AI', credibility: 5 },
  { name: 'Next.js Blog', url: 'https://nextjs.org/feed.xml', type: 'rss', domain: 'FullStack', credibility: 5 },
  { name: 'Vercel Blog', url: 'https://vercel.com/atom', type: 'rss', domain: 'FullStack', credibility: 4 },
  { name: '36氪', url: 'https://36kr.com/feed', type: 'rss', domain: 'Investment', credibility: 3 },
  { name: '少数派', url: 'https://sspai.com/feed', type: 'rss', domain: 'Productivity', credibility: 4 },
];

// RSSHub 数据源（如果配置了）
// 默认使用 rsshub.umzzz.com (已验证可用)
const RSSHUB_BASE = process.env.RSSHUB_URL || 'https://rsshub.umzzz.com';

if (RSSHUB_BASE) {
  RSS_SOURCES.push(
    { name: '知乎热榜', url: `${RSSHUB_BASE}/zhihu/hot`, type: 'rsshub', domain: 'Hot', credibility: 3 },
    { name: 'B站番剧排行', url: `${RSSHUB_BASE}/bilibili/ranking/1/3`, type: 'rsshub', domain: 'Entertainment', credibility: 3 }
  );
}

function generateId(link: string): string {
  return createHash('md5').update(link).digest('hex').substring(0, 16);
}

async function collectSource(source: typeof RSS_SOURCES[0]) {
  const start = Date.now();
  try {
    const feed = await parser.parseURL(source.url);
    const items = feed.items.map(item => ({
      item_id: generateId(item.link || item.guid || ''),
      title: item.title || 'Untitled',
      link: item.link || '',
      content: item.contentSnippet || item.content || '',
      source: source.name,
      domain: source.domain,
      published_at: item.pubDate || new Date().toISOString(),
      collected_at: new Date().toISOString(),
      credibility_score: source.credibility,
    }));
    return { success: true, name: source.name, count: items.length, time: Date.now() - start, items };
  } catch (error) {
    return { success: false, name: source.name, error: (error as Error).message, time: Date.now() - start };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 并行采集
    const BATCH_SIZE = 5;
    const results: any[] = [];
    const allItems: any[] = [];

    for (let i = 0; i < RSS_SOURCES.length; i += BATCH_SIZE) {
      const batch = RSS_SOURCES.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(batch.map(s => collectSource(s)));
      
      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          results.push(r.value);
          if (r.value.items) {
            allItems.push(...r.value.items);
          }
        }
      }
    }

    // 批量查询已存在的 item_id（只查一次）
    const itemIds = allItems.map(item => item.item_id);
    const { data: existingItems } = await supabaseAdmin
      .from('info_items')
      .select('item_id')
      .in('item_id', itemIds);

    const existingIds = new Set(existingItems?.map(item => item.item_id) || []);

    // 只插入不存在的
    const newItems = allItems.filter(item => !existingIds.has(item.item_id));
    
    if (newItems.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('info_items')
        .insert(newItems.slice(0, 100)); // 限制单次插入条数

      if (insertError) {
        console.error('Insert error:', insertError);
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return res.status(200).json({
      success: true,
      sources: results.length,
      successCount,
      failed: results.length - successCount,
      collected: allItems.length,
      existing: existingIds.size,
      inserted: newItems.length,
      time: results.reduce((sum, r) => sum + r.time, 0),
    });
  } catch (error) {
    console.error('Collect error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
