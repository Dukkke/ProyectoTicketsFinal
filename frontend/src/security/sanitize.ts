// src/security/sanitize.ts
import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir ataques XSS
 * Usar en TODO input del usuario antes de renderizar
 */
export const sanitizeHtml = (dirty: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: eliminar tags HTML
    return dirty.replace(/<[^>]*>/g, '');
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitiza input de texto plano (sin HTML permitido)
 */
export const sanitizeText = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')           // Eliminar < y >
    .replace(/javascript:/gi, '')   // Prevenir javascript: URLs
    .replace(/on\w+=/gi, '')        // Prevenir event handlers
    .trim();
};

/**
 * Sanitiza URLs para prevenir javascript: injection
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

/**
 * Escapa caracteres especiales para uso en expresiones regulares
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
