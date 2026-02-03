import type { NextApiRequest, NextApiResponse } from 'next';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimaxi.com/v1';

interface MiniMaxMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MiniMaxRequest {
  model: string;
  messages: MiniMaxMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface MiniMaxResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: MiniMaxMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callMiniMax(content: string): Promise<string> {
  const systemPrompt = `你是一个专业的新闻摘要助手。你的任务是：

1. 用 **100字以内** 总结文章的核心内容
2. 保留关键信息、数据和结论
3. 去除废话、铺垫和营销内容
4. 保持客观中立，不添加个人观点
5. 普通人也能看懂

格式要求：
- 直接输出摘要，不要有"以下是摘要："等前缀
- 不要使用 Markdown 格式
- 用简洁的中文表达`;

  const requestBody: MiniMaxRequest = {
    model: 'MiniMax-M2.1',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请总结以下文章：

${content}` },
    ],
    max_tokens: 500,
    temperature: 0.3,
  };

  const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('MiniMax API error:', error);
    throw new Error(`MiniMax API failed: ${error}`);
  }

  const data: MiniMaxResponse = await response.json();

  if (data.choices && data.choices.length > 0) {
    return data.choices[0].message.content.trim();
  }

  throw new Error('No response from MiniMax');
}

async function getCachedSummary(supabaseAdmin: any, itemId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('info_items')
    .select('ai_summary')
    .eq('id', itemId)
    .single();

  return data?.ai_summary || null;
}

async function saveSummary(supabaseAdmin: any, itemId: string, summary: string): Promise<void> {
  await supabaseAdmin
    .from('info_items')
    .update({ ai_summary: summary })
    .eq('id', itemId);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { item_id, content, force_regenerate } = req.body;

  if (!item_id) {
    return res.status(400).json({ error: 'Missing item_id' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let summary: string;

    // Try to get cached summary first (unless force_regenerate)
    if (!force_regenerate) {
      const cachedSummary = await getCachedSummary(supabaseAdmin, item_id);
      if (cachedSummary) {
        return res.status(200).json({
          success: true,
          summary: cachedSummary,
          cached: true,
        });
      }
    }

    // Get content from database
    const { data: item } = await supabaseAdmin
      .from('info_items')
      .select('content')
      .eq('id', item_id)
      .single();

    if (!item?.content) {
      return res.status(404).json({ error: 'Item not found or no content' });
    }

    summary = await callMiniMax(item.content);
    
    // Save to database
    await saveSummary(supabaseAdmin, item_id, summary);

    return res.status(200).json({
      success: true,
      summary,
      cached: false,
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate summary',
    });
  }
}
