/**
 * RSSHub 平台路由映射
 * 将常见平台的 URL 转换为 RSSHub RSS feed URL
 */

interface RSSHubRoute {
  rss: string;
  name: string;
  platform: string;
}

const RSSHUB_BASE = 'http://101.32.243.232:1200';

export function parseRSSHubURL(inputUrl: string): RSSHubRoute | null {
  try {
    const url = new URL(inputUrl);
    const hostname = url.hostname.replace('www.', '');
    const pathname = url.pathname;

    // Twitter
    if (hostname === 'twitter.com' || hostname === 'x.com') {
      const match = pathname.match(/^\/([^\/]+)\/?$/);
      if (match) {
        const username = match[1];
        return {
          rss: `${RSSHUB_BASE}/twitter/user/${username}`,
          name: `Twitter @${username}`,
          platform: 'twitter'
        };
      }
    }

    // GitHub User
    if (hostname === 'github.com') {
      const parts = pathname.split('/').filter(Boolean);
      
      // GitHub User: /username
      if (parts.length === 1) {
        const username = parts[0];
        return {
          rss: `${RSSHUB_BASE}/github/user/repos/${username}`,
          name: `GitHub ${username}`,
          platform: 'github'
        };
      }
      
      // GitHub Repo: /username/repo
      if (parts.length === 2) {
        const [user, repo] = parts;
        return {
          rss: `${RSSHUB_BASE}/github/issue/${user}/${repo}`,
          name: `${user}/${repo} Issues`,
          platform: 'github'
        };
      }
      
      // GitHub Trending
      if (pathname.startsWith('/trending')) {
        return {
          rss: `${RSSHUB_BASE}/github/trending/daily`,
          name: 'GitHub Trending (Daily)',
          platform: 'github'
        };
      }
    }

    // 知乎
    if (hostname === 'zhihu.com' || hostname === 'www.zhihu.com') {
      // 知乎热榜
      if (pathname === '/hot' || pathname === '/') {
        return {
          rss: `${RSSHUB_BASE}/zhihu/hot`,
          name: '知乎热榜',
          platform: 'zhihu'
        };
      }
      
      // 知乎用户
      const userMatch = pathname.match(/^\/people\/([^\/]+)/);
      if (userMatch) {
        const userId = userMatch[1];
        return {
          rss: `${RSSHUB_BASE}/zhihu/people/activities/${userId}`,
          name: `知乎用户 ${userId}`,
          platform: 'zhihu'
        };
      }
    }

    // B站
    if (hostname === 'bilibili.com' || hostname === 'www.bilibili.com' || hostname === 'space.bilibili.com') {
      // B站用户空间
      const spaceMatch = pathname.match(/^\/(\d+)/);
      if (spaceMatch) {
        const uid = spaceMatch[1];
        return {
          rss: `${RSSHUB_BASE}/bilibili/user/video/${uid}`,
          name: `B站 UP主 ${uid}`,
          platform: 'bilibili'
        };
      }
      
      // B站排行榜
      if (pathname.startsWith('/ranking')) {
        return {
          rss: `${RSSHUB_BASE}/bilibili/ranking/0/3/1`,
          name: 'B站全站排行榜',
          platform: 'bilibili'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to parse URL:', error);
    return null;
  }
}

/**
 * 验证 RSS feed 是否可用
 */
export async function validateRSSFeed(rssUrl: string): Promise<boolean> {
  try {
    const response = await fetch(rssUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to validate RSS feed:', error);
    return false;
  }
}
