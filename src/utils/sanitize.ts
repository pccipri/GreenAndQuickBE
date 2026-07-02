import sanitizeHtml from 'sanitize-html';

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a'],
  allowedAttributes: { a: ['href'] },
  allowedSchemes: ['http', 'https', 'mailto'],
};

/**
 * Strip all HTML and normalize whitespace for plain-text fields (reviews, names, titles).
 */
export function sanitizePlainText(text: string): string {
  const stripped = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
  return stripped.trim().replace(/\s+/g, ' ');
}

/**
 * Allow limited formatting tags for description fields.
 */
export function sanitizeRichText(text: string): string {
  return sanitizeHtml(text, RICH_TEXT_OPTIONS).trim();
}

/**
 * Escape special regex characters for safe MongoDB $regex usage.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and normalize Supabase storage paths — reject traversal and absolute URLs.
 */
export function normalizeStoragePath(path: string): string {
  const trimmed = path.trim();

  if (!trimmed) {
    throw new Error('validation.storagePathRequired');
  }

  if (trimmed.includes('..') || trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) {
    throw new Error('validation.invalidStoragePath');
  }

  return trimmed;
}

/**
 * Decode, trim, and validate external URLs (http/https only).
 */
export function normalizeUrl(url: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(url.trim());
  } catch {
    throw new Error('validation.invalidUrl');
  }

  let parsed: URL;
  try {
    parsed = new URL(decoded);
  } catch {
    throw new Error('validation.invalidUrl');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('validation.invalidUrl');
  }

  return parsed.href;
}
