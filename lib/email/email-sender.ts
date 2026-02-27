import { resend, FROM_EMAIL as RESEND_FROM } from "./resend-client";
import { getSendCloudClient } from "./sendcloud-client";

// 国内邮箱域名列表
const CHINA_EMAIL_DOMAINS = [
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "sina.cn",
  "sohu.com",
  "yeah.net",
  "139.com",
  "189.cn",
  "wo.cn",
  "aliyun.com",
  "foxmail.com",
];

export function isChinaEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  
  return CHINA_EMAIL_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`));
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ 
  success: boolean; 
  error?: string;
  provider?: "resend" | "sendcloud";
}> {
  const isChina = isChinaEmail(params.to);

  // 如果是国内邮箱且 SendCloud 已配置，使用 SendCloud
  if (isChina) {
    const sendcloud = getSendCloudClient();
    if (sendcloud) {
      console.log(`Sending to China email ${params.to} via SendCloud`);
      const result = await sendcloud.sendEmail(params);
      return { ...result, provider: "sendcloud" };
    } else {
      console.log(`SendCloud not configured, falling back to Resend for ${params.to}`);
    }
  }

  // 否则使用 Resend
  try {
    console.log(`Sending to ${params.to} via Resend`);
    await resend.emails.send({
      from: RESEND_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { success: true, provider: "resend" };
  } catch (error: any) {
    console.error("Resend send error:", error);
    return { success: false, error: error.message, provider: "resend" };
  }
}
