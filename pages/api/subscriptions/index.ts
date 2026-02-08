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

      // Delete all existing subscriptions
      const { error: deleteError } = await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting subscriptions:', deleteError);
        return res.status(500).json({ error: 'Failed to delete subscriptions' });
      }

      // Insert new subscriptions
      if (domains.length > 0) {
        const subscriptions = domains.map(domain => ({
          user_id: user.id,
          domain,
          enabled: true,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('subscriptions')
          .insert(subscriptions);

        if (insertError) {
          console.error('Error inserting subscriptions:', insertError);
          return res.status(500).json({ error: 'Failed to insert subscriptions' });
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
