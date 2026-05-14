export const DEFAULT_PUSH_LIMIT = 5;
export const MIN_PUSH_LIMIT = 1;
export const MAX_PUSH_LIMIT = 100;

export function normalizePushLimit(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_PUSH_LIMIT;
  }

  const limit = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(limit)) {
    throw new Error('推送条数必须是正整数');
  }

  if (limit < MIN_PUSH_LIMIT || limit > MAX_PUSH_LIMIT) {
    throw new Error('推送条数范围必须是 1-100');
  }

  return limit;
}
