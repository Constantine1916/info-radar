import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // 获取最近7天的所有采集数据
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: allItems } = await supabaseAdmin
      .from('info_items')
      .select('*')
      .gte('collected_at', weekAgo.toISOString())
      .order('credibility_score', { ascending: false })
      .limit(200);

    if (!allItems || allItems.length === 0) {
      return res.status(200).json({ domains: [] });
    }

    // 按 source 分组
    const sourceMap: Record<string, typeof allItems> = {};
    for (const item of allItems) {
      if (!sourceMap[item.source]) sourceMap[item.source] = [];
      sourceMap[item.source].push(item);
    }

    const domainData = Object.entries(sourceMap).map(([source, items]) => ({
      key: source,
      name: source,
      emoji: '📌',
      description: '',
      count: items.length,
      items: items.slice(0, 10).map(item => ({
        id: item.id, title: item.title, link: item.link,
        source: item.source, credibility_score: item.credibility_score,
        published_at: item.published_at, ai_summary: item.ai_summary || null,
      })),
    }));

    return res.status(200).json({ success: true, domains: domainData, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Hot items error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
