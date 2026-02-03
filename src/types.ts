export interface InfoItem {
  id: string;
  title: string;
  link: string;
  content: string;
  source: string;
  domain: string; // AI, FullStack, ChinaPolicy, WorldPolitics, Investment
  publishedAt: Date;
  collectedAt: Date;
  credibilityScore?: number;
  verified?: boolean;
}

export interface DataSource {
  name: string;
  url: string;
  type: 'rss' | 'api' | 'crawler';
  domain: string;
  credibility: number; // 1-5
}
