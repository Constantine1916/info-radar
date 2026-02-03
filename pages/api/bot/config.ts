import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Create clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Verify bot token is valid
async function verifyBotToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (response.data.ok) {
      return {
        valid: true,
        username: response.data.result.username,
      };
    }
    return { valid: false, error: 'Invalid bot token' };
  } catch (error) {
    return { valid: false, error: 'Failed to verify bot token' };
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
    // Get current bot config
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('telegram_bot_token, telegram_chat_id, telegram_verified')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        error: 'Profile not found',
        details: profileError?.message,
        userId: user.id
      });
    }

    // Don't expose the full token, just indicate if it's set
    return res.status(200).json({
      hasToken: !!profile.telegram_bot_token,
      chatId: profile.telegram_chat_id,
      verified: profile.telegram_verified || false,
    });
  }

  if (req.method === 'POST') {
    const { botToken, chatId } = req.body;

    if (!botToken || !chatId) {
      return res.status(400).json({ error: 'Bot token and chat ID are required' });
    }

    // Verify bot token
    const verification = await verifyBotToken(botToken);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error || 'Invalid bot token' });
    }

    // Save to database
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        telegram_bot_token: botToken,
        telegram_chat_id: chatId,
        telegram_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to save bot config' });
    }

    return res.status(200).json({
      success: true,
      botUsername: verification.username,
    });
  }

  if (req.method === 'DELETE') {
    // Remove bot config
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        telegram_bot_token: null,
        telegram_chat_id: null,
        telegram_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to remove bot config' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
