import { DataSource } from '../types';

export const RSS_SOURCES: DataSource[] = [
  // AI/技术趋势
  {
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    type: 'rss',
    domain: 'AI',
    credibility: 4
  },
  // OpenAI Blog - 暂时禁用（403 Forbidden）
  // {
  //   name: 'OpenAI Blog',
  //   url: 'https://openai.com/blog/rss/',
  //   type: 'rss',
  //   domain: 'AI',
  //   credibility: 5
  // },
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
  // Vercel Blog - URL 已失效，替换为新地址
  {
    name: 'Vercel Blog',
    url: 'https://vercel.com/atom',
    type: 'rss',
    domain: 'FullStack',
    credibility: 4
  },
  
  // 世界局势/政治 - 已取消订阅
  // {
  //   name: 'BBC News',
  //   url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
  //   type: 'rss',
  //   domain: 'WorldPolitics',
  //   credibility: 5
  // },
  // {
  //   name: 'The Guardian World',
  //   url: 'https://www.theguardian.com/world/rss',
  //   type: 'rss',
  //   domain: 'WorldPolitics',
  //   credibility: 5
  // },
  
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
  }
];
