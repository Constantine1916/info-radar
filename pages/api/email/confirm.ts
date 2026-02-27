import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).send("Invalid verification token");
  }

  // 查找匹配的用户
  const { data: settings, error } = await supabaseAdmin
    .from("user_settings")
    .select("user_id")
    .eq("email_verification_token", token)
    .single();

  if (error || !settings) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>验证失败</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>❌ 验证失败</h1>
        <p>验证链接无效或已过期</p>
        <a href="/settings">返回设置页面</a>
      </body>
      </html>
    `);
  }

  // 更新验证状态
  const { error: updateError } = await supabaseAdmin
    .from("user_settings")
    .update({
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      email_verification_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", settings.user_id);

  if (updateError) {
    return res.status(500).send("Failed to verify email");
  }

  // 返回成功页面
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>验证成功</title>
      <meta http-equiv="refresh" content="3;url=/settings">
    </head>
    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>✅ 邮箱验证成功！</h1>
      <p>您现在可以接收邮件推送了</p>
      <p>3 秒后自动跳转到设置页面...</p>
      <a href="/settings">立即跳转</a>
    </body>
    </html>
  `);
}
