const VALID_LANGUAGES = ['en', 'ro'] as const;
export type ValidLanguage = (typeof VALID_LANGUAGES)[number];

/**
 * Validates if a language code is supported
 * @param lang - The language code to validate
 * @returns true if the language is supported, false otherwise
 */
export function isValidLanguage(lang: string): lang is ValidLanguage {
  return VALID_LANGUAGES.includes(lang as ValidLanguage);
}

/**
 * Sanitizes a language code, returning a valid language or defaulting to 'en'
 * @param lang - The language code to sanitize (optional)
 * @returns A valid language code
 */
export function sanitizeLanguage(lang?: string): ValidLanguage {
  if (lang && isValidLanguage(lang)) {
    return lang;
  }
  return 'en';
}

/**
 * Gets all supported languages
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): readonly ValidLanguage[] {
  return VALID_LANGUAGES;
}
