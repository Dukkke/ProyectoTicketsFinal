// src/features/auth/hooks/useLoginForm.ts
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loginSchema, validate } from '@/security/validation';
import { regenerateCsrfToken } from '@/security/csrf';
import type { LoginCredentials, AuthResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UseLoginFormReturn {
    email: string;
    password: string;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    loading: boolean;
    error: string | null;
    validationErrors: string[];
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useLoginForm = (role: string = 'estudiante'): UseLoginFormReturn => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setValidationErrors([]);

        // Validar con Zod
        const validation = validate(loginSchema, { email, password });
        if (!validation.success) {
            setValidationErrors(validation.errors);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, role }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Credenciales inválidas');
            }

            const data: AuthResponse = await response.json();

            // Guardar token y datos de usuario
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            // Regenerar token CSRF después de login
            regenerateCsrfToken();

            // Redirigir según rol
            const redirectMap: Record<string, string> = {
                'estudiante': '/estudiante',
                'estudiante-remoto': '/estudiante-remoto',
                'academico': '/academico',
                'coordinador': '/coordinador',
                'admin': '/admin',
            };

            router.push(redirectMap[data.user.role] || '/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [email, password, role, router]);

    return {
        email,
        password,
        setEmail,
        setPassword,
        loading,
        error,
        validationErrors,
        handleSubmit,
    };
};
