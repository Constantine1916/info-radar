import { InfoItem } from "../types";

interface GroupedItems {
  [sourceName: string]: InfoItem[];
}

export function generatePushEmailHTML(items: InfoItem[], date: string): string {
  // 按数据源分组
  const grouped: GroupedItems = {};
  items.forEach(item => {
    if (!grouped[item.source]) {
      grouped[item.source] = [];
    }
    grouped[item.source].push(item);
  });

  const sections = Object.entries(grouped).map(([source, sourceItems]) => {
    const itemsHTML = sourceItems.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <a href="${item.link}" style="color: #1a1a1a; text-decoration: none; font-size: 14px; line-height: 1.6; display: block;">
            ${escapeHtml(item.title)}
          </a>
          ${item.content ? `<p style="margin: 6px 0 0 0; color: #666; font-size: 13px; line-height: 1.5;">${escapeHtml(item.content.substring(0, 150))}${item.content.length > 150 ? "..." : ""}</p>` : ""}
        </td>
      </tr>
    `).join("");

    return `
      <div style="margin-bottom: 32px;">
        <h2 style="margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #e5e5e5; color: #1a1a1a; font-size: 18px; font-weight: 600;">
          ${getSourceEmoji(source)} ${source} <span style="color: #999; font-weight: normal; font-size: 14px;">(${sourceItems.length} 条)</span>
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHTML}
        </table>
      </div>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Info Radar - 今日推送</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 12px;">📡</div>
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Info Radar</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${date} 今日推送</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      ${sections}
    </div>

    <!-- Footer -->
    <div style="padding: 24px; background-color: #f5f5f5; border-top: 1px solid #e5e5e5; text-align: center;">
      <p style="margin: 0; color: #999; font-size: 12px;">
        📡 <a href="https://info-radar-alpha.vercel.app" style="color: #667eea; text-decoration: none;">Info Radar</a> - 打破信息差
      </p>
      <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">
        <a href="https://info-radar-alpha.vercel.app/settings" style="color: #999; text-decoration: none;">管理推送设置</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateVerificationEmailHTML(verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Info Radar 邮箱验证</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
    <div style="padding: 48px 24px; text-align: center;">
      <div style="font-size: 64px; margin-bottom: 24px;">📧</div>
      <h1 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 24px;">Info Radar 邮箱验证</h1>
      <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; line-height: 1.6;">
        您正在绑定此邮箱用于接收 Info Radar 的信息推送。
      </p>
      <p style="margin: 0 0 32px 0; color: #666; font-size: 14px; line-height: 1.6;">
        请点击下方按钮完成验证：
      </p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
        立即验证邮箱
      </a>
      <p style="margin: 32px 0 16px 0; color: #999; font-size: 12px;">
        如果按钮无法点击，请复制以下链接到浏览器访问：
      </p>
      <p style="margin: 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; color: #667eea; font-size: 12px; word-break: break-all;">
        ${verificationUrl}
      </p>
      <p style="margin: 24px 0 0 0; color: #999; font-size: 12px;">
        如果这不是您的操作，请忽略此邮件。
      </p>
    </div>
    <div style="padding: 16px 24px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; color: #999; font-size: 11px;">
        此邮件由 Info Radar 系统自动发送，请勿回复。
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getSourceEmoji(source: string): string {
  const emojiMap: { [key: string]: string } = {
    "Hacker News": "🔶",
    "36氪": "🚀",
    "少数派": "✨",
    "知乎热榜": "🔥",
    "B站全站排行": "📺",
    "B站科技区排行": "⚡",
  };
  return emojiMap[source] || "📰";
}
