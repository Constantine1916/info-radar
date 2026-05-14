import assert from 'node:assert/strict';
import test from 'node:test';

import { splitMessageByByteLength } from '../lib/message-chunks';

test('keeps short messages as one chunk', () => {
  assert.deepEqual(splitMessageByByteLength('a\nb', 10), ['a\nb']);
});

test('splits long messages on line boundaries', () => {
  assert.deepEqual(splitMessageByByteLength('aa\nbb\ncc', 4), ['aa', 'bb', 'cc']);
});

test('preserves oversize single lines as their own chunk', () => {
  assert.deepEqual(splitMessageByByteLength('abcdef\nx', 5), ['abcdef', 'x']);
});
