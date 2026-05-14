export function splitMessageByByteLength(text: string, maxBytes: number): string[] {
  if (Buffer.byteLength(text, 'utf8') <= maxBytes) {
    return [text];
  }

  const chunks: string[] = [];
  let current = '';

  for (const line of text.split('\n')) {
    const next = current ? `${current}\n${line}` : line;

    if (Buffer.byteLength(next, 'utf8') <= maxBytes) {
      current = next;
      continue;
    }

    if (current) {
      chunks.push(current);
    }
    current = line;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
