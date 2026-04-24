export const sanitizeFileSegment = (value: string): string =>
  value
    .replace(/^File:/i, '')
    .replace(/[^a-z0-9.-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
