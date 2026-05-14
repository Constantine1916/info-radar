import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_PUSH_LIMIT, normalizePushLimit } from '../lib/feed-push-limit';

test('defaults missing push limits to five', () => {
  assert.equal(normalizePushLimit(undefined), DEFAULT_PUSH_LIMIT);
  assert.equal(normalizePushLimit(null), DEFAULT_PUSH_LIMIT);
  assert.equal(normalizePushLimit(''), DEFAULT_PUSH_LIMIT);
});

test('accepts integer push limits from one to one hundred', () => {
  assert.equal(normalizePushLimit(1), 1);
  assert.equal(normalizePushLimit(5), 5);
  assert.equal(normalizePushLimit('100'), 100);
});

test('rejects non-integer and out-of-range push limits', () => {
  assert.throws(() => normalizePushLimit(0), /1-100/);
  assert.throws(() => normalizePushLimit(101), /1-100/);
  assert.throws(() => normalizePushLimit(1.5), /正整数/);
  assert.throws(() => normalizePushLimit('abc'), /正整数/);
});
