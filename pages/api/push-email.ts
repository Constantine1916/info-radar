import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { sendEmail } from "../../lib/email/email-sender";
import { generatePushEmailHTML } from "../../lib/email/templates";
import Parser from "rss-parser";
import { InfoItem } from "../../lib/types";

const parser = new Parser();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // 获取用户邮箱配置
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("user_profiles")
    .select("email_address, email_verified")
    .eq("id", user.id)
    .single();

  if (settingsError || !settings?.email_address) {
    return res.status(400).json({ error: "No email configured" });
  }

  if (!settings.email_verified) {
    return res.status(400).json({ error: "Email not verified" });
  }

  // 获取用户的 RSS 源
  const { data: feeds, error: feedsError } = await supabaseAdmin
    .from("user_feeds")
    .select("*")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .order("sort_order");

  if (feedsError || !feeds || feeds.length === 0) {
    return res.status(400).json({ error: "No active feeds" });
  }

  // 采集所有源的最新内容
  const allItems: InfoItem[] = [];
  
  for (const feed of feeds) {
    try {
      const rssFeed = await parser.parseURL(feed.url);
      const items = rssFeed.items.slice(0, 5).map((item, idx) => ({
        id: `temp-${feed.name}-${idx}`,
        item_id: item.guid || item.link || `${feed.name}-${idx}`,
        title: item.title || "无标题",
        link: item.link || "",
        content: item.contentSnippet || item.content || "",
        source: feed.name,
        domain: feed.name,
        published_at: item.pubDate || new Date().toISOString(),
        collected_at: new Date().toISOString(),
        credibility_score: 0,
      }));
      allItems.push(...items);
    } catch (error) {
      console.error(`Failed to fetch feed ${feed.name}:`, error);
    }
  }

  if (allItems.length === 0) {
    return res.status(400).json({ error: "No items to send" });
  }

  // 生成邮件内容
  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const emailHTML = generatePushEmailHTML(allItems, today);

  // 发送邮件
  const result = await sendEmail({
    to: settings.email_address,
    subject: `📡 Info Radar - 今日推送 (${today})`,
    html: emailHTML,
  });

  if (result.success) {
    console.log(`Push email sent via ${result.provider} to ${settings.email_address}`);
    return res.status(200).json({ 
      success: true,
      itemCount: allItems.length,
      feedCount: feeds.length,
      provider: result.provider,
    });
  } else {
    console.error("Failed to send email:", result.error);
    return res.status(500).json({ error: result.error || "Failed to send email" });
  }
}
