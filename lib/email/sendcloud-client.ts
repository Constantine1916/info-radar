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
      const timestamp = Date.now();
      const signParams = {
        apiUser: this.config.apiUser,
        apiKey: this.config.apiKey,
        timestamp: timestamp.toString(),
      };

      // 生成签名
      const signature = this.generateSignature(signParams);

      const formData = new URLSearchParams({
        apiUser: this.config.apiUser,
        from: this.config.from,
        fromName: this.config.fromName,
        to: params.to,
        subject: params.subject,
        html: params.html,
        timestamp: timestamp.toString(),
        signature: signature,
      });

      const response = await fetch("https://api.sendcloud.net/apiv2/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (data.result && data.statusCode === 200) {
        return { success: true };
      } else {
        return { success: false, error: data.message || "Unknown error" };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private generateSignature(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    const str = sortedKeys.map(key => `${key}=${params[key]}`).join("&");
    return crypto.createHash("md5").update(str).digest("hex");
  }
}

export function getSendCloudClient(): SendCloudClient | null {
  if (!process.env.SENDCLOUD_API_USER || !process.env.SENDCLOUD_API_KEY) {
    return null;
  }

  return new SendCloudClient({
    apiUser: process.env.SENDCLOUD_API_USER,
    apiKey: process.env.SENDCLOUD_API_KEY,
    from: process.env.SENDCLOUD_FROM_EMAIL || "noreply@sendcloud.org",
    fromName: process.env.SENDCLOUD_FROM_NAME || "Info Radar",
  });
}
