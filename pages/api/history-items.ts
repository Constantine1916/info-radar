import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { domains, sent_at } = req.body;
  if (!domains || !sent_at) return res.status(400).json({ error: 'Missing domains or sent_at' });

  try {
    const sentAtDate = new Date(sent_at);
    const startOfDay = new Date(sentAtDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sentAtDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: items } = await supabaseAdmin
      .from('info_items')
      .select('id, title, link, source, domain, credibility_score, published_at, ai_summary')
      .in('domain', domains)
      .gte('published_at', startOfDay.toISOString())
      .lte('published_at', endOfDay.toISOString())
      .order('credibility_score', { ascending: false })
      .limit(50);

    return res.status(200).json({ success: true, items: items || [] });
  } catch (error) {
    console.error('History items error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
