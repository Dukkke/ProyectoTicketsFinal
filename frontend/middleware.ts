// middleware.ts - Middleware de seguridad Next.js
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const PROTECTED_PATHS = [
    '/estudiante',
    '/estudiante-remoto',
    '/academico',
    '/coordinador',
    '/admin',
];

// Rutas públicas (no requieren auth)
const PUBLIC_PATHS = [
    '/',
    '/login',
    '/register',
    '/change-password',
    '/malla',
];

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const { pathname } = request.nextUrl;

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ HEADERS DE SEGURIDAD
    // ═══════════════════════════════════════════════════════════════

    // Prevenir clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevenir MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Filtro XSS del navegador (legacy pero útil)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Control de referrer
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permisos de características del navegador
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' http://localhost:* https://*.uahurtado.cl",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; ')
    );

    // HSTS (activar en producción con HTTPS)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload'
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔐 VERIFICACIÓN DE AUTENTICACIÓN
    // ═══════════════════════════════════════════════════════════════

    // Verificar si la ruta actual requiere autenticación
    const isProtectedPath = PROTECTED_PATHS.some(path =>
        pathname.startsWith(path)
    );

    if (isProtectedPath) {
        // Obtener token de las cookies
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            // Sin token -> redirigir a login
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Verificar estructura básica del token JWT
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Token inválido');
            }

            // Decodificar payload para verificar expiración
            const payload = JSON.parse(atob(parts[1]));

            if (payload.exp && payload.exp * 1000 < Date.now()) {
                // Token expirado
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('expired', 'true');
                loginUrl.searchParams.set('redirect', pathname);

                // Limpiar cookie expirada
                const redirectResponse = NextResponse.redirect(loginUrl);
                redirectResponse.cookies.delete('auth_token');
                return redirectResponse;
            }
        } catch {
            // Token malformado
            const loginUrl = new URL('/login', request.url);
            const redirectResponse = NextResponse.redirect(loginUrl);
            redirectResponse.cookies.delete('auth_token');
            return redirectResponse;
        }
    }

    return response;
}

// Configurar qué rutas procesa el middleware
export const config = {
    matcher: [
        /*
         * Aplicar a todas las rutas excepto:
         * - api (rutas de API)
         * - _next/static (archivos estáticos)
         * - _next/image (optimización de imágenes)
         * - favicon.ico (favicon)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public|images|videos).*)',
    ],
};
