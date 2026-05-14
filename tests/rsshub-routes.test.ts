import assert from 'node:assert/strict';
import test from 'node:test';

import { parseRSSHubURL, validateRSSFeed } from '../lib/rsshub-routes';

test('parses a direct RSS feed URL', () => {
  const parsed = parseRSSHubURL('https://aihot.virxact.com/feed/daily.xml');

  assert.deepEqual(parsed, {
    rss: 'https://aihot.virxact.com/feed.xml',
    name: 'AI HOT',
    platform: 'rss',
  });
});

test('falls back to GET when HEAD validation is inconclusive', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'HEAD') {
      return new Response(null, { status: 304 });
    }

    assert.equal(init?.method, 'GET');
    return new Response('<?xml version="1.0"?><rss version="2.0"></rss>', {
      status: 200,
      headers: { 'content-type': 'application/rss+xml' },
    });
  }) as typeof fetch;

  try {
    assert.equal(await validateRSSFeed('https://aihot.virxact.com/feed/daily.xml'), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects generic XML that is not a feed', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: { 'content-type': 'application/xml' },
      });
    }

    return new Response('<?xml version="1.0"?><urlset></urlset>', {
      status: 200,
      headers: { 'content-type': 'application/xml' },
    });
  }) as typeof fetch;

  try {
    assert.equal(await validateRSSFeed('https://example.com/sitemap.xml'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
