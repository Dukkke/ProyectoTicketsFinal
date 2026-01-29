// src/constants/routes.ts
// Rutas de la aplicación centralizadas

export const ROUTES = {
    // Públicas
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    CHANGE_PASSWORD: '/change-password',
    MALLA: '/malla',

    // Portales
    ESTUDIANTE: '/estudiante',
    ESTUDIANTE_REMOTO: '/estudiante-remoto',
    ACADEMICO: '/academico',
    COORDINADOR: '/coordinador',
    ADMIN: '/admin',

    // OAuth
    OAUTH_CALLBACK: '/oauth/callback',
} as const;

// Rutas de API
export const API_ROUTES = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',

    // Tickets
    TICKETS: '/tickets',
    TICKET_BY_ID: (id: string) => `/tickets/${id}`,
    TICKET_MESSAGES: (id: string) => `/tickets/${id}/messages`,

    // Usuarios
    USERS: '/users',
    USER_BY_ID: (id: string) => `/users/${id}`,

    // Stats
    STATS: '/stats',
} as const;

// Roles permitidos por ruta
export const ROUTE_ROLES: Record<string, string[]> = {
    [ROUTES.ESTUDIANTE]: ['estudiante'],
    [ROUTES.ESTUDIANTE_REMOTO]: ['estudiante-remoto'],
    [ROUTES.ACADEMICO]: ['academico'],
    [ROUTES.COORDINADOR]: ['coordinador'],
    [ROUTES.ADMIN]: ['admin', 'coordinador'],
};
