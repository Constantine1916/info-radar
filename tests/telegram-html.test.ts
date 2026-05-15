import assert from 'node:assert/strict';
import test from 'node:test';

import { escapeTelegramHtml, telegramLink } from '../lib/telegram-html';

test('escapes Telegram HTML text content', () => {
  assert.equal(
    escapeTelegramHtml('OpenAI & <Meta> "news"'),
    'OpenAI &amp; &lt;Meta&gt; &quot;news&quot;'
  );
});

test('escapes Telegram HTML link labels and href attributes', () => {
  assert.equal(
    telegramLink('https://example.com/?a=1&b="x"', 'A&B <news>'),
    '<a href="https://example.com/?a=1&amp;b=&quot;x&quot;">A&amp;B &lt;news&gt;</a>'
  );
});
