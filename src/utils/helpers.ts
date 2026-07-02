import z from 'zod';

export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export const jsonString = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, schema);

/**
 * Manual HTML escaping — prefer sanitizePlainText from @/utils/sanitize for new code.
 * @deprecated Use sanitizePlainText instead.
 */
export const escapeHtml = (str: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
};
