import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '../../lib/supabase-admin';
import { getPushItemKeys } from '../../lib/push-item-likes';

type HistoryLikeResponse =
  | { likes: Array<{ push_history_id: string; item_key: string }> }
  | { liked: boolean }
  | { error: string };

async function getAuthenticatedUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return user;
}

function parsePushIds(queryValue: string | string[] | undefined) {
  const rawValue = Array.isArray(queryValue) ? queryValue.join(',') : queryValue || '';

  return rawValue
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoryLikeResponse>
) {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const pushIds = parsePushIds(req.query.push_ids);
    if (pushIds.length === 0) return res.status(200).json({ likes: [] });

    const { data: ownedRecords, error: recordsError } = await supabaseAdmin
      .from('push_history')
      .select('id')
      .eq('user_id', user.id)
      .in('id', pushIds);

    if (recordsError) {
      return res.status(500).json({ error: 'Failed to fetch push history records' });
    }

    const ownedPushIds = (ownedRecords || []).map(record => record.id);
    if (ownedPushIds.length === 0) return res.status(200).json({ likes: [] });

    const { data: likes, error: likesError } = await supabaseAdmin
      .from('push_item_likes')
      .select('push_history_id, item_key')
      .eq('user_id', user.id)
      .in('push_history_id', ownedPushIds);

    if (likesError) return res.status(500).json({ error: 'Failed to fetch likes' });

    return res.status(200).json({ likes: likes || [] });
  }

  if (req.method === 'POST') {
    const { push_history_id, item_key, liked } = req.body || {};

    if (typeof push_history_id !== 'string' || typeof item_key !== 'string' || typeof liked !== 'boolean') {
      return res.status(400).json({ error: 'Invalid like payload' });
    }

    const { data: record, error: recordError } = await supabaseAdmin
      .from('push_history')
      .select('id, items')
      .eq('id', push_history_id)
      .eq('user_id', user.id)
      .single();

    if (recordError || !record) return res.status(404).json({ error: 'Push record not found' });

    const validItemKeys = getPushItemKeys(record.items);
    if (!validItemKeys.includes(item_key)) {
      return res.status(400).json({ error: 'Push item not found' });
    }

    if (liked) {
      const { error: upsertError } = await supabaseAdmin
        .from('push_item_likes')
        .upsert(
          {
            user_id: user.id,
            push_history_id,
            item_key,
          },
          { onConflict: 'user_id,push_history_id,item_key' }
        );

      if (upsertError) return res.status(500).json({ error: 'Failed to save like' });
      return res.status(200).json({ liked: true });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('push_item_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('push_history_id', push_history_id)
      .eq('item_key', item_key);

    if (deleteError) return res.status(500).json({ error: 'Failed to remove like' });

    return res.status(200).json({ liked: false });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
