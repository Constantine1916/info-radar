import type { NextApiRequest, NextApiResponse } from 'next';
import { RSSCollector } from '../../src/collectors/rss-collector';
import { InfoFilter } from '../../src/processors/filter';
import { RSS_SOURCES } from '../../src/config/sources';
import { supabaseAdmin } from '../../lib/supabase-admin';

type ResponseData = {
  success: boolean;
  collected?: number;
  filtered?: number;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Verify cron secret
  const authToken = req.headers['authorization'];
  const expectedToken = process.env.CRON_SECRET;
  
  if (authToken !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized' 
    });
  }

  try {
    console.log('🚀 Info Radar collecting...');
    
    // Step 1: Collect from RSS
    const collector = new RSSCollector();
    const rawItems = await collector.collectAll(RSS_SOURCES);
    
    // Step 2: Filter
    const filter = new InfoFilter();
    const filteredItems = filter.filter(rawItems);
    
    // Step 3: Save to database
    const itemsToInsert = filteredItems.map(item => ({
      item_id: item.id,
      title: item.title,
      link: item.link,
      content: item.content,
      source: item.source,
      domain: item.domain,
      published_at: item.publishedAt.toISOString(),
      credibility_score: item.credibilityScore,
    }));

    // Insert with conflict handling (ignore duplicates)
    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('info_items')
        .upsert(itemsToInsert, { onConflict: 'item_id', ignoreDuplicates: true });

      if (insertError) {
        console.error('Error saving items:', insertError);
      }
    }
    
    console.log(`✅ Collected ${rawItems.length}, filtered ${filteredItems.length}, saved to DB`);
    
    return res.status(200).json({
      success: true,
      collected: rawItems.length,
      filtered: filteredItems.length,
      message: 'Info collected and saved'
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
