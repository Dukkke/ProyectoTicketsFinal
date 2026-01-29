// src/hooks/useApi.ts
'use client';

import { useState, useCallback } from 'react';
import { getCsrfToken } from '@/security/csrf';

interface ApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseApiOptions {
    skipAuth?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Hook genérico para llamadas a API con manejo de estado
 */
export function useApi<T>() {
    const [state, setState] = useState<ApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const request = useCallback(async (
        endpoint: string,
        options: RequestInit & UseApiOptions = {}
    ): Promise<T | null> => {
        const { skipAuth = false, ...fetchOptions } = options;

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            };

            // Agregar token de autenticación
            if (!skipAuth) {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
                }
            }

            // Agregar token CSRF para mutaciones
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(fetchOptions.method || '')) {
                const csrfToken = getCsrfToken();
                if (csrfToken) {
                    (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
                }
            }

            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...fetchOptions,
                headers,
                credentials: 'include',
            });

            // Manejar errores de autenticación
            if (response.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_data');
                window.location.href = '/login?session=expired';
                throw new Error('Sesión expirada');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || 'Error en la solicitud');
            }

            const data = await response.json();
            setState({ data, loading: false, error: null });
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setState(prev => ({ ...prev, loading: false, error: errorMessage }));
            return null;
        }
    }, []);

    const get = useCallback((endpoint: string, options?: UseApiOptions) => {
        return request(endpoint, { method: 'GET', ...options });
    }, [request]);

    const post = useCallback((endpoint: string, data: unknown, options?: UseApiOptions) => {
        return request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
        });
    }, [request]);

    const put = useCallback((endpoint: string, data: unknown, options?: UseApiOptions) => {
        return request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options,
        });
    }, [request]);

    const del = useCallback((endpoint: string, options?: UseApiOptions) => {
        return request(endpoint, { method: 'DELETE', ...options });
    }, [request]);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    return {
        ...state,
        request,
        get,
        post,
        put,
        delete: del,
        reset,
    };
}
