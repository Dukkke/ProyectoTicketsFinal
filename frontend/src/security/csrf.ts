// src/security/csrf.ts
'use client';

/**
 * Genera un token CSRF único usando crypto API
 */
export const generateCsrfToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Obtiene o genera un token CSRF
 */
export const getCsrfToken = (): string => {
    if (typeof window === 'undefined') return '';

    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
        token = generateCsrfToken();
        sessionStorage.setItem('csrf_token', token);
    }
    return token;
};

/**
 * Valida un token CSRF contra el almacenado
 */
export const validateCsrfToken = (token: string): boolean => {
    if (typeof window === 'undefined') return false;
    const storedToken = sessionStorage.getItem('csrf_token');
    return token === storedToken && token.length > 0;
};

/**
 * Regenera el token CSRF (usar después de operaciones sensibles)
 */
export const regenerateCsrfToken = (): string => {
    if (typeof window === 'undefined') return '';

    const newToken = generateCsrfToken();
    sessionStorage.setItem('csrf_token', newToken);
    return newToken;
};

/**
 * Hook para manejar tokens CSRF en componentes React
 */
export const useCsrf = () => {
    return {
        getToken: getCsrfToken,
        validateToken: validateCsrfToken,
        regenerateToken: regenerateCsrfToken,
    };
};
