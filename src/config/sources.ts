import { DataSource } from '../types';

// RSSHub 服务地址（本地或远程）
const RSSHUB_BASE = process.env.RSSHUB_URL || 'http://localhost:1200';

export const RSS_SOURCES: DataSource[] = [
  // AI/技术趋势
  {
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    type: 'rss',
    domain: 'AI',
    credibility: 4
  },
  {
    name: 'Arxiv AI',
    url: 'http://export.arxiv.org/rss/cs.AI',
    type: 'rss',
    domain: 'AI',
    credibility: 5
  },
  {
    name: 'MIT Technology Review AI',
    url: 'https://www.technologyreview.com/feed/',
    type: 'rss',
    domain: 'AI',
    credibility: 5
  },
  
  // 全栈开发
  {
    name: 'Next.js Blog',
    url: 'https://nextjs.org/feed.xml',
    type: 'rss',
    domain: 'FullStack',
    credibility: 5
  },
  {
    name: 'Node.js Blog',
    url: 'https://nodejs.org/en/feed/blog.xml',
    type: 'rss',
    domain: 'FullStack',
    credibility: 5
  },
  {
    name: 'Vercel Blog',
    url: 'https://vercel.com/atom',
    type: 'rss',
    domain: 'FullStack',
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

  // RSSHub 数据源（本地服务）
  {
    name: '知乎热榜',
    url: `${RSSHUB_BASE}/zhihu/hot`,
    type: 'rsshub',
    domain: 'Hot',
    credibility: 3
  },
  {
    name: 'B站番剧排行',
    url: `${RSSHUB_BASE}/bilibili/ranking/1/3`,
    type: 'rsshub',
    domain: 'Entertainment',
    credibility: 3
  }
];
