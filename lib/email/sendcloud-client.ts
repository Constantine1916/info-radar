import crypto from "crypto";

interface SendCloudConfig {
  apiUser: string;
  apiKey: string;
  from: string;
  fromName: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export class SendCloudClient {
  private config: SendCloudConfig;

  constructor(config: SendCloudConfig) {
    this.config = config;
  }

  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      // SendCloud API v2 普通发送
      // 不使用时间戳和签名，改用直接的 apiUser + apiKey
      const formData = new URLSearchParams({
        apiUser: this.config.apiUser,
        apiKey: this.config.apiKey,
        from: this.config.from,
        fromName: this.config.fromName,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      console.log("SendCloud request:", {
        apiUser: this.config.apiUser,
        to: params.to,
        from: this.config.from,
        url: "https://api.sendcloud.net/apiv2/mail/send",
      });

      const response = await fetch("https://api.sendcloud.net/apiv2/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();
      console.log("SendCloud response:", JSON.stringify(data, null, 2));

      if (data.result && data.statusCode === 200) {
        return { success: true };
      } else {
        console.error("SendCloud API error:", JSON.stringify(data, null, 2));
        return { success: false, error: data.message || JSON.stringify(data) };
      }
    } catch (error: any) {
      console.error("SendCloud error:", error);
      return { success: false, error: error.message };
    }
  }
}

export function getSendCloudClient(): SendCloudClient | null {
  if (!process.env.SENDCLOUD_API_USER || !process.env.SENDCLOUD_API_KEY) {
    console.log("SendCloud not configured");
    return null;
  }

  console.log("SendCloud client initialized with user:", process.env.SENDCLOUD_API_USER);

  return new SendCloudClient({
    apiUser: process.env.SENDCLOUD_API_USER,
    apiKey: process.env.SENDCLOUD_API_KEY,
    // 使用大写的 SendCloud，和后台测试一致
    from: process.env.SENDCLOUD_FROM_EMAIL || "SendCloud@rm2apk.sendcloud.org",
    fromName: process.env.SENDCLOUD_FROM_NAME || "Info Radar",
  });
}
