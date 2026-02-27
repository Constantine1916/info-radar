import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Create clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Verify webhook URL is valid
async function verifyWebhook(webhookKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Extract key from full URL if provided
    const key = webhookKey.includes('key=') 
      ? webhookKey.split('key=')[1].split('&')[0]
      : webhookKey;
    
    const testUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`;
    
    // Just validate format, don't actually send
    if (!key || key.length < 10) {
      return { valid: false, error: 'Invalid webhook key format' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to verify webhook' };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify token and get user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token', details: userError?.message });
  }

  if (req.method === 'GET') {
    // Get current webhook config
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('webhook_key, webhook_enabled')
      .eq('id', user.id)
      .single();

    // 如果 profile 不存在，返回默认未配置状态（而不是 404）
    if (profileError || !profile) {
      return res.status(200).json({
        hasWebhook: false,
        enabled: false,
      });
    }

    return res.status(200).json({
      hasWebhook: !!profile.webhook_key,
      enabled: profile.webhook_enabled || false,
    });
  }

  if (req.method === 'POST') {
    const { webhookKey } = req.body;

    if (!webhookKey) {
      return res.status(400).json({ error: 'Webhook key is required' });
    }

    // Verify webhook key
    const verification = await verifyWebhook(webhookKey);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error || 'Invalid webhook' });
    }

    // Extract just the key
    const key = webhookKey.includes('key=') 
      ? webhookKey.split('key=')[1].split('&')[0]
      : webhookKey;

    // Save to database
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        webhook_key: key,
        webhook_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to save webhook config' });
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook configured successfully',
    });
  }

  if (req.method === 'DELETE') {
    // Remove webhook config
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        webhook_key: null,
        webhook_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to remove webhook config' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
