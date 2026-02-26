import { DataSource } from '../types';

// RSSHub 服务地址（需要配置环境变量 RSSHUB_URL）
const RSSHUB_BASE = process.env.RSSHUB_URL;

// 辅助函数：安全创建 DataSource（只在 RSSHUB_URL 存在时创建）
function createRSSHubSource(name: string, url: string, domain: string, credibility: number): DataSource | null {
  if (!RSSHUB_BASE) return null;
  return {
    name,
    url: `${RSSHUB_BASE}${url}`,
    type: 'rsshub',
    domain,
    credibility
  };
}

export const RSS_SOURCES: DataSource[] = [
  // AI/技术趋势
  {
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    type: 'rss',
    domain: 'AI',
    credibility: 4
  },

  // 投资/创业
  {
    name: '36氪',
    url: 'https://36kr.com/feed',
    type: 'rss',
    domain: 'Investment',
    credibility: 3
  },

  // 高质量中文技术/效率源
  {
    name: '少数派',
    url: 'https://sspai.com/feed',
    type: 'rss',
    domain: 'Productivity',
    credibility: 4
  },

  // === GitHub Trending（通过 RSSHub）===
  ...(createRSSHubSource('GitHub Trending 每日', '/github/trending/daily/any', 'AI', 4) ? [createRSSHubSource('GitHub Trending 每日', '/github/trending/daily/any', 'AI', 4)!] : []),
  ...(createRSSHubSource('GitHub Trending 每周', '/github/trending/weekly/any', 'AI', 4) ? [createRSSHubSource('GitHub Trending 每周', '/github/trending/weekly/any', 'AI', 4)!] : []),

  // === Twitter/X AI 博主（通过 RSSHub）===
  ...(createRSSHubSource('宝玉 @xiaohu', '/twitter/user/xiaohu', 'AI', 4) ? [createRSSHubSource('宝玉 @xiaohu', '/twitter/user/xiaohu', 'AI', 4)!] : []),
  ...(createRSSHubSource('Orange @oran_ge', '/twitter/user/oran_ge', 'AI', 4) ? [createRSSHubSource('Orange @oran_ge', '/twitter/user/oran_ge', 'AI', 4)!] : []),
  ...(createRSSHubSource('Dotey @dotey', '/twitter/user/dotey', 'AI', 4) ? [createRSSHubSource('Dotey @dotey', '/twitter/user/dotey', 'AI', 4)!] : []),
  ...(createRSSHubSource('Vista8 @vista8', '/twitter/user/vista8', 'AI', 4) ? [createRSSHubSource('Vista8 @vista8', '/twitter/user/vista8', 'AI', 4)!] : []),
  ...(createRSSHubSource('Khazix @Khazix0918', '/twitter/user/Khazix0918', 'AI', 4) ? [createRSSHubSource('Khazix @Khazix0918', '/twitter/user/Khazix0918', 'AI', 4)!] : []),

  // === RSSHub 数据源 ===
  ...(createRSSHubSource('知乎热榜', '/zhihu/hot', 'Hot', 3) ? [createRSSHubSource('知乎热榜', '/zhihu/hot', 'Hot', 3)!] : []),
  ...(createRSSHubSource('B站全站排行榜', '/bilibili/ranking/0/3', 'Entertainment', 3) ? [createRSSHubSource('B站全站排行榜', '/bilibili/ranking/0/3', 'Entertainment', 3)!] : []),
  ...(createRSSHubSource('B站科技区排行', '/bilibili/ranking/17/3', 'Technology', 3) ? [createRSSHubSource('B站科技区排行', '/bilibili/ranking/17/3', 'Technology', 3)!] : []),
  ...(createRSSHubSource('36氪快讯', '/36kr/newsflashes', 'Investment', 3) ? [createRSSHubSource('36氪快讯', '/36kr/newsflashes', 'Investment', 3)!] : [])
].filter((s): s is DataSource => s !== null);
