// src/features/auth/hooks/useRegisterForm.ts
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema, validate } from '@/security/validation';
import { sanitizeText } from '@/security/sanitize';
import type { RegisterData } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FormData {
    nombre: string;
    apellido: string;
    email: string;
    rut: string;
    password: string;
    confirmPassword: string;
}

interface UseRegisterFormReturn {
    formData: FormData;
    setFormData: (data: Partial<FormData>) => void;
    loading: boolean;
    error: string | null;
    validationErrors: string[];
    success: boolean;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useRegisterForm = (): UseRegisterFormReturn => {
    const router = useRouter();
    const [formData, setFormDataState] = useState<FormData>({
        nombre: '',
        apellido: '',
        email: '',
        rut: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);

    const setFormData = useCallback((data: Partial<FormData>) => {
        setFormDataState(prev => ({ ...prev, ...data }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setValidationErrors([]);
        setSuccess(false);

        // Validar con Zod
        const validation = validate(registerSchema, formData);
        if (!validation.success) {
            setValidationErrors(validation.errors);
            return;
        }

        try {
            setLoading(true);

            // Sanitizar datos antes de enviar
            const sanitizedData: RegisterData = {
                nombre: sanitizeText(formData.nombre),
                apellido: sanitizeText(formData.apellido),
                email: formData.email.toLowerCase().trim(),
                rut: formData.rut.trim(),
                password: formData.password,
            };

            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sanitizedData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Error al registrar');
            }

            setSuccess(true);

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [formData, router]);

    return {
        formData,
        setFormData,
        loading,
        error,
        validationErrors,
        success,
        handleSubmit,
    };
};
