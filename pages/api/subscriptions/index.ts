import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '../../../lib/supabase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get user from session
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET - fetch subscriptions
    if (req.method === 'GET') {
      const { data: subscriptions, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch subscriptions' });
      }

      return res.status(200).json({ subscriptions });
    }

    // POST - update subscriptions
    if (req.method === 'POST') {
      const { domains } = req.body as { domains: string[] };

      if (!domains || !Array.isArray(domains)) {
        return res.status(400).json({ error: 'Invalid domains' });
      }

      // 使用 upsert 替换所有订阅（更安全，避免 RLS 问题）
      if (domains.length > 0) {
        const subscriptions = domains.map(domain => ({
          user_id: user.id,
          domain,
          enabled: true,
          // 如果表有 created_at 字段，保留原有的
        }));

        const { error: upsertError } = await supabaseAdmin
          .from('subscriptions')
          .upsert(subscriptions, {
            onConflict: 'user_id, domain',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error('Error upserting subscriptions:', upsertError);
          return res.status(500).json({ error: 'Failed to update subscriptions: ' + upsertError.message });
        }
      } else {
        // 如果domains为空，删除所有订阅
        const { error: deleteError } = await supabaseAdmin
          .from('subscriptions')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error deleting subscriptions:', deleteError);
          return res.status(500).json({ error: 'Failed to clear subscriptions: ' + deleteError.message });
        }
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
