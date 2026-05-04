export interface PushLikeItem {
  title?: string | null;
  link?: string | null;
  source?: string | null;
}

function normalizeField(value: string | null | undefined) {
  return (value || '').trim();
}

function hashString(value: string) {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function getPushItemKey(item: PushLikeItem, index: number) {
  const payload = JSON.stringify([
    normalizeField(item.link),
    normalizeField(item.source),
    normalizeField(item.title),
  ]);

  return `${index}:${hashString(payload)}`;
}

export function getPushItemKeys(items: unknown) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const pushItem = item && typeof item === 'object' ? item as PushLikeItem : {};
    return getPushItemKey(pushItem, index);
  });
}

export function getPushItemLikeStateKey(pushHistoryId: string, itemKey: string) {
  return `${pushHistoryId}:${itemKey}`;
}
