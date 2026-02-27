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
      // 构建参数对象（不包含签名）
      const requestParams: Record<string, string> = {
        apiUser: this.config.apiUser,
        from: this.config.from,
        fromName: this.config.fromName,
        to: params.to,
        subject: params.subject,
        html: params.html,
      };

      // 生成签名（参数 + API_KEY）
      const signature = this.generateSignature(requestParams, this.config.apiKey);

      // 添加签名到参数
      const formData = new URLSearchParams({
        ...requestParams,
        signature: signature,
      });

      console.log("SendCloud request:", {
        apiUser: this.config.apiUser,
        to: params.to,
        from: this.config.from,
      });

      const response = await fetch("https://api.sendcloud.net/apiv2/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();
      console.log("SendCloud response:", data);

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

  private generateSignature(params: Record<string, string>, apiKey: string): string {
    // SendCloud 签名算法：
    // 1. 对参数按 key 排序
    // 2. 拼接成 key=value& 格式
    // 3. 最后加上 &key=API_KEY
    // 4. MD5 加密
    const sortedKeys = Object.keys(params).sort();
    const paramStr = sortedKeys.map(key => `${key}=${params[key]}`).join("&");
    const signStr = `${paramStr}&key=${apiKey}`;
    
    console.log("Sign string (without key):", paramStr);
    
    return crypto.createHash("md5").update(signStr).digest("hex");
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
    from: process.env.SENDCLOUD_FROM_EMAIL || "noreply@rm2apk.sendcloud.org",
    fromName: process.env.SENDCLOUD_FROM_NAME || "Info Radar",
  });
}
