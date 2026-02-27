import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (req.method === "GET") {
    // 获取邮箱配置
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .select("email_enabled, email_address, email_verified")
      .eq("user_id", user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      enabled: data?.email_enabled || false,
      address: data?.email_address || "",
      verified: data?.email_verified || false,
    });
  }

  if (req.method === "POST") {
    // 保存邮箱配置
    const { email_address, email_enabled } = req.body;

    if (!email_address || typeof email_address !== "string") {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_address)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // 检查是否已有配置
    const { data: existing } = await supabaseAdmin
      .from("user_settings")
      .select("email_address, email_verified")
      .eq("user_id", user.id)
      .single();

    // 如果邮箱地址改变，需要重新验证
    const needsVerification = existing?.email_address !== email_address;

    const { error } = await supabaseAdmin
      .from("user_settings")
      .upsert({
        user_id: user.id,
        email_address,
        email_enabled: email_enabled !== undefined ? email_enabled : false,
        email_verified: needsVerification ? false : (existing?.email_verified || false),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true,
      needsVerification 
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
