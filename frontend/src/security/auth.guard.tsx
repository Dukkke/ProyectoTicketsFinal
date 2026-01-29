// src/security/auth.guard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    fallbackUrl?: string;
}

/**
 * Componente que protege rutas requiriendo autenticación
 * Envuelve páginas que necesitan usuario autenticado
 */
export const AuthGuard = ({
    children,
    allowedRoles,
    fallbackUrl = '/login'
}: AuthGuardProps) => {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = localStorage.getItem('auth_token');
                const userRole = localStorage.getItem('user_role');

                // Sin token -> redirigir a login
                if (!token) {
                    router.push(fallbackUrl);
                    return;
                }

                // Verificar expiración del token JWT
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const expirationTime = payload.exp * 1000;

                    if (expirationTime < Date.now()) {
                        // Token expirado
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user_role');
                        localStorage.removeItem('user_data');
                        router.push(`${fallbackUrl}?expired=true`);
                        return;
                    }
                } catch {
                    // Token inválido
                    localStorage.removeItem('auth_token');
                    router.push(fallbackUrl);
                    return;
                }

                // Verificar rol si se especificaron roles permitidos
                if (allowedRoles && allowedRoles.length > 0) {
                    if (!userRole || !allowedRoles.includes(userRole)) {
                        router.push('/unauthorized');
                        return;
                    }
                }

                // Todo OK
                setIsAuthorized(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router, allowedRoles, fallbackUrl]);

    // Mostrar loading mientras verifica
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#f5f5f5'
            }}>
                <div style={{
                    padding: '20px',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    Verificando sesión...
                </div>
            </div>
        );
    }

    // Si no está autorizado, no renderizar nada (ya redirigió)
    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
};

/**
 * HOC alternativo para proteger páginas
 */
export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    allowedRoles?: string[]
) {
    return function AuthenticatedComponent(props: P) {
        return (
            <AuthGuard allowedRoles={allowedRoles}>
                <WrappedComponent {...props} />
            </AuthGuard>
        );
    };
}

/**
 * Hook para obtener información del usuario autenticado
 */
export const useAuthUser = () => {
    const [user, setUser] = useState<{
        email: string;
        role: string;
        name: string;
    } | null>(null);

    useEffect(() => {
        try {
            const userData = localStorage.getItem('user_data');
            const userRole = localStorage.getItem('user_role');

            if (userData) {
                const parsed = JSON.parse(userData);
                setUser({
                    email: parsed.email || '',
                    name: parsed.nombre || parsed.name || '',
                    role: userRole || '',
                });
            }
        } catch {
            setUser(null);
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_data');
        sessionStorage.removeItem('csrf_token');
        window.location.href = '/login';
    };

    return { user, logout, isAuthenticated: !!user };
};
