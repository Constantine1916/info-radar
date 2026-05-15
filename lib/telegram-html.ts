export function escapeTelegramHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function telegramLink(href: string, label: string): string {
  return `<a href="${escapeTelegramHtml(href)}">${escapeTelegramHtml(label)}</a>`;
}
