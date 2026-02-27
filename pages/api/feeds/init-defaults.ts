import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { SYSTEM_FEEDS } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // 检查是否已经初始化过
    const { data: existing } = await supabase
      .from('user_feeds')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(200).json({ message: 'Already initialized' });
    }

    // 插入所有默认源
    const feedsToInsert = SYSTEM_FEEDS.map((feed, index) => ({
      user_id: user.id,
      name: feed.name,
      url: feed.url,
      enabled: true,
      is_system: true,
      sort_order: index,
    }));

    const { error: insertError } = await supabase
      .from('user_feeds')
      .insert(feedsToInsert);

    if (insertError) throw insertError;

    res.status(200).json({ message: 'Defaults initialized', count: feedsToInsert.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
