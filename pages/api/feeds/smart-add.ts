import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { parseRSSHubURL, validateRSSFeed } from '../../../lib/rsshub-routes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 尝试解析为 RSSHub 支持的平台
    const parsed = parseRSSHubURL(url);
    
    if (!parsed) {
      return res.status(400).json({ 
        error: '暂不支持该平台',
        hint: '请直接输入 RSS feed URL，或使用以下平台：Twitter、GitHub、知乎、B站'
      });
    }

    // 验证 RSS feed 是否可用
    const isValid = await validateRSSFeed(parsed.rss);
    if (!isValid) {
      return res.status(400).json({ 
        error: 'RSS feed 无法访问',
        hint: '请检查 URL 是否正确，或稍后重试'
      });
    }

    // 检查是否已存在
    const { data: existing } = await supabaseAdmin
      .from('user_feeds')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', parsed.rss)
      .single();

    if (existing) {
      return res.status(400).json({ error: '该源已存在' });
    }

    // 获取当前最大排序值
    const { data: feeds } = await supabaseAdmin
      .from('user_feeds')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = feeds && feeds.length > 0 ? feeds[0].sort_order + 1 : 0;

    // 添加到数据库
    const { data: newFeed, error: insertError } = await supabaseAdmin
      .from('user_feeds')
      .insert({
        user_id: user.id,
        name: parsed.name,
        url: parsed.rss,
        is_system: false,
        sort_order: nextOrder,
        enabled: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert feed:', insertError);
      return res.status(500).json({ error: 'Failed to add feed' });
    }

    return res.status(200).json({
      success: true,
      feed: newFeed,
      platform: parsed.platform,
    });
  } catch (error: any) {
    console.error('Smart add error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
