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
    throw new Error(`MiniMax API error: ${error}`);
  }

  const data: MiniMaxResponse = await response.json();

  if (data.choices && data.choices.length > 0) {
    return data.choices[0].message.content.trim();
  }

  throw new Error('No response from MiniMax');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const authToken = req.headers['authorization'];
  const expectedToken = process.env.CRON_SECRET;
  
  if (authToken !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { item_ids } = req.body;

  if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
    return res.status(400).json({ error: 'Missing item_ids array' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get items without summary
    const { data: items } = await supabaseAdmin
      .from('info_items')
      .select('id, content')
      .in('id', item_ids)
      .is('ai_summary', null);

    if (!items || items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All items already have summaries',
        processed: 0,
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each item
    for (const item of items) {
      try {
        const summary = await callMiniMax(item.content);
        
        await supabaseAdmin
          .from('info_items')
          .update({ ai_summary: summary })
          .eq('id', item.id);

        results.success++;
        
        // Rate limiting - wait between calls
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.failed++;
        results.errors.push(`${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json({
      success: true,
      processed: results.success,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Batch summary error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate summaries',
    });
  }
}
