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
  sort_order: number;
}

export interface UserFeed {
  id: string;
  user_id: string;
  name: string;
  url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  sort_order: number;
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

export interface DataSource {
  name: string;
  url: string;
  type: 'rss' | 'api' | 'crawler' | 'rsshub';
  domain: string;
  credibility: number;
}

// 默认公共 RSS 源（新用户初始化用）
export const DEFAULT_FEEDS = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: '36氪', url: 'https://36kr.com/feed' },
  { name: '少数派', url: 'https://sspai.com/feed' },
];
