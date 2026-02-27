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
  is_system: boolean;
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
export interface SystemFeed {
  name: string;
  url: string;
  isSystem: true;
}

export const SYSTEM_FEEDS: SystemFeed[] = [
  { name: 'Hacker News', url: 'http://101.32.243.232:1200/hackernews/newest', isSystem: true },
  { name: '36氪', url: 'http://101.32.243.232:1200/36kr/newsflashes', isSystem: true },
  { name: '少数派', url: 'http://101.32.243.232:1200/sspai/index', isSystem: true },
  { name: 'GitHub Trending 每日', url: 'http://101.32.243.232:1200/github/trending/daily', isSystem: true },
  { name: 'GitHub Trending 每周', url: 'http://101.32.243.232:1200/github/trending/weekly', isSystem: true },
  { name: '知乎热榜', url: 'http://101.32.243.232:1200/zhihu/hotlist', isSystem: true },
  { name: 'B站热榜', url: 'http://101.32.243.232:1200/bilibili/ranking/0/3/1', isSystem: true },
];

// 保留旧的 DEFAULT_FEEDS 兼容
export const DEFAULT_FEEDS = SYSTEM_FEEDS;
