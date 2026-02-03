import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { DOMAINS } from '../../lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user's subscriptions
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('domain')
      .eq('user_id', user.id)
      .eq('enabled', true);

    if (!subs || subs.length === 0) {
      return res.status(200).json({ domains: [] });
    }

    const subscribedDomains = subs.map(s => s.domain);

    // Get recent items for subscribed domains (last 7 days for more data)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: allItems } = await supabaseAdmin
      .from('info_items')
      .select('*')
      .in('domain', subscribedDomains)
      .gte('collected_at', weekAgo.toISOString())
      .order('credibility_score', { ascending: false })
      .limit(200);

    if (!allItems || allItems.length === 0) {
      return res.status(200).json({ domains: [] });
    }

    // Group by domain and get top 10 per domain
    const domainData = subscribedDomains.map(domainKey => {
      const domainItems = allItems.filter(item => item.domain === domainKey);
      const topItems = domainItems
        .sort((a, b) => b.credibility_score - a.credibility_score)
        .slice(0, 10);

      const domainInfo = DOMAINS[domainKey as keyof typeof DOMAINS];

      return {
        key: domainKey,
        name: domainInfo.name,
        emoji: domainInfo.emoji,
        description: domainInfo.description,
        count: domainItems.length,
        items: topItems.map(item => ({
          id: item.id,
          title: item.title,
          link: item.link,
          source: item.source,
          credibility_score: item.credibility_score,
          published_at: item.published_at,
          ai_summary: item.ai_summary || null,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      domains: domainData,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Hot items error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
