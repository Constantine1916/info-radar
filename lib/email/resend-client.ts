import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// 使用 Resend 的默认发件域名（onboarding@resend.dev）
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Info Radar <onboarding@resend.dev>";
