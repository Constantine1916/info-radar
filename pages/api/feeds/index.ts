import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '../../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // GET - 获取用户的 RSS 源列表
  if (req.method === 'GET') {
    const { data: feeds, error } = await supabaseAdmin
      .from('user_feeds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: 'Failed to fetch feeds' });
    return res.status(200).json({ feeds: feeds || [] });
  }

  // POST - 添加新 RSS 源
  if (req.method === 'POST') {
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ error: '请填写名称和 URL' });

    // 简单校验 URL
    try { new URL(url); } catch { return res.status(400).json({ error: 'URL 格式不正确' }); }

    const { data, error } = await supabaseAdmin
      .from('user_feeds')
      .insert({ user_id: user.id, name, url })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: '该 RSS 源已存在' });
      return res.status(500).json({ error: 'Failed to add feed: ' + error.message });
    }
    return res.status(201).json({ feed: data });
  }

  // PUT - 编辑 RSS 源
  if (req.method === 'PUT') {
    const { id, name, url } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing feed id' });
    if (!name && !url) return res.status(400).json({ error: '请至少提供名称或 URL' });

    if (url) {
      try { new URL(url); } catch { return res.status(400).json({ error: 'URL 格式不正确' }); }
    }

    const update: Record<string, string> = {};
    if (name) update.name = name;
    if (url) update.url = url;

    const { data, error } = await supabaseAdmin
      .from('user_feeds')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: '该 RSS 源已存在' });
      return res.status(500).json({ error: 'Failed to update feed: ' + error.message });
    }
    return res.status(200).json({ feed: data });
  }

  // DELETE - 删除 RSS 源
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing feed id' });

    const { error } = await supabaseAdmin
      .from('user_feeds')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: 'Failed to delete feed' });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
