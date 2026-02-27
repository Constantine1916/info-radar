import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { resend, FROM_EMAIL } from "../../../lib/email/resend-client";
import { generateVerificationEmailHTML } from "../../../lib/email/templates";
import crypto from "crypto";

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
    .select("email_address")
    .eq("user_id", user.id)
    .single();

  if (settingsError || !settings?.email_address) {
    return res.status(400).json({ error: "No email address configured" });
  }

  // 生成验证 token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  
  // 保存 token
  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({
      email_verification_token: verificationToken,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) {
    return res.status(500).json({ error: "Failed to save verification token" });
  }

  // 发送验证邮件
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://info-radar-alpha.vercel.app"}/api/email/confirm?token=${verificationToken}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: settings.email_address,
      subject: "📡 Info Radar - 验证您的邮箱",
      html: generateVerificationEmailHTML(verificationUrl),
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Failed to send verification email:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
