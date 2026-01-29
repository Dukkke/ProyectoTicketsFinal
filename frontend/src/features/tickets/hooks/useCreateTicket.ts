// src/features/tickets/hooks/useCreateTicket.ts
'use client';

import { useState, useCallback } from 'react';
import { sanitizeText } from '@/security';
import { ticketSchema, validate } from '@/security/validation';
import { getCsrfToken } from '@/security/csrf';
import type { CreateTicketData, Ticket } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UseCreateTicketReturn {
    loading: boolean;
    error: string | null;
    validationErrors: string[];
    createTicket: (data: CreateTicketData) => Promise<Ticket | null>;
    resetErrors: () => void;
}

export const useCreateTicket = (): UseCreateTicketReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const resetErrors = useCallback(() => {
        setError(null);
        setValidationErrors([]);
    }, []);

    const createTicket = useCallback(async (data: CreateTicketData): Promise<Ticket | null> => {
        resetErrors();

        // Validar datos con Zod
        const validation = validate(ticketSchema, data);
        if (!validation.success) {
            setValidationErrors(validation.errors);
            return null;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('Debes iniciar sesión para crear un ticket');
            return null;
        }

        try {
            setLoading(true);

            // Sanitizar datos antes de enviar
            const sanitizedData = {
                titulo: sanitizeText(data.titulo),
                descripcion: sanitizeText(data.descripcion),
                categoria: data.categoria,
            };

            const response = await fetch(`${API_BASE}/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken(),
                },
                body: JSON.stringify(sanitizedData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Error al crear ticket');
            }

            const newTicket = await response.json();
            return newTicket;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            return null;
        } finally {
            setLoading(false);
        }
    }, [resetErrors]);

    return {
        loading,
        error,
        validationErrors,
        createTicket,
        resetErrors,
    };
};
