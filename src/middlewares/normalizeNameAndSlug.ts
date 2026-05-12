/**
 * Generates a URL-friendly slug from a given string, typically a name or title.
 * @param name The input string to slugify.
 * @returns A lowercase, hyphen-separated string suitable for URLs.
 */
export function normalizeNameAndSlug(name: string): string {
  return name
    .normalize('NFKD') // split accents from letters
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '') // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, '') // trim leading/trailing hyphens
    .slice(0, 120); // Ensure slug is not too long for URL limits
}
