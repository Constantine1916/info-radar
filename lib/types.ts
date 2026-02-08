export interface UserProfile {
  id: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_verified: boolean;
  webhook_key?: string;
  webhook_enabled?: boolean;
  verification_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  domain: 
    | 'AI' 
    | 'FullStack' 
    | 'ChinaPolicy' 
    | 'WorldPolitics' 
    | 'Investment'
    | 'Crypto'
    | 'Product'
    | 'Design'
    | 'Productivity'
    | 'Hot'
    | 'Entertainment';
  enabled: boolean;
  created_at: string;
}

export interface InfoItem {
  id: string;
  item_id: string;
  title: string;
  link: string;
  content: string;
  source: string;
  domain: string;
  published_at: string;
  collected_at: string;
  credibility_score: number;
}

export interface PushHistory {
  id: string;
  user_id: string;
  items_count: number;
  domains: string[];
  sent_at: string;
  success: boolean;
}

export const DOMAINS = {
  AI: { name: 'AI / 技术趋势', emoji: '🤖', description: '前沿AI研究、技术突破、行业动态' },
  FullStack: { name: '全栈开发', emoji: '💻', description: 'Next.js、Node.js、React生态更新' },
  ChinaPolicy: { name: '中国政策 / 市场', emoji: '🇨🇳', description: '政策解读、市场动态、监管变化' },
  WorldPolitics: { name: '世界局势 / 政治', emoji: '🌍', description: '国际关系、地缘政治、重大事件' },
  Investment: { name: '投资 / 创业', emoji: '💰', description: '股市动态、创业资讯、融资消息' },
  Crypto: { name: 'Crypto / Web3', emoji: '₿', description: '区块链、加密货币、DeFi、NFT' },
  Product: { name: '产品经理', emoji: '📦', description: '产品设计、增长策略、用户研究' },
  Design: { name: '设计 / 视觉', emoji: '🎨', description: 'UI/UX设计、设计系统、创意趋势' },
  Productivity: { name: '效率工具', emoji: '⚡', description: '生产力工具、时间管理、自动化' },
  Hot: { name: '热点榜单', emoji: '🔥', description: '知乎、B站等热点内容' },
  Entertainment: { name: '娱乐内容', emoji: '🎬', description: '番剧、动漫、游戏等娱乐内容' }
} as const;

export const DOMAIN_CONFIG = {
  AI: { maxItems: 3, minCredibility: 3 },
  FullStack: { maxItems: 3, minCredibility: 3 },
  ChinaPolicy: { maxItems: 3, minCredibility: 4 },
  WorldPolitics: { maxItems: 3, minCredibility: 4 },
  Investment: { maxItems: 3, minCredibility: 4 },
  Crypto: { maxItems: 3, minCredibility: 3 },
  Product: { maxItems: 3, minCredibility: 3 },
  Design: { maxItems: 3, minCredibility: 3 },
  Productivity: { maxItems: 3, minCredibility: 3 },
  Hot: { maxItems: 5, minCredibility: 2 },
  Entertainment: { maxItems: 5, minCredibility: 2 }
} as const;

export interface DataSource {
  name: string;
  url: string;
  type: 'rss' | 'api' | 'crawler' | 'rsshub';
  domain: string;
  credibility: number;
}
