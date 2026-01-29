// src/features/tickets/hooks/useTicketList.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { sanitizeText } from '@/security';
import type { Ticket, TicketFilters, TicketStatus } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UseTicketListReturn {
    tickets: Ticket[];
    loading: boolean;
    error: string | null;
    filters: TicketFilters;
    setFilters: (filters: TicketFilters) => void;
    handleDelete: (id: string) => Promise<void>;
    handleRefresh: () => void;
    handleStatusChange: (id: string, status: TicketStatus) => Promise<void>;
}

export const useTicketList = (initialFilters?: TicketFilters): UseTicketListReturn => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<TicketFilters>(initialFilters || {});

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('No autenticado');
            }

            // Construir query params
            const params = new URLSearchParams();
            if (filters.estado) params.append('estado', filters.estado);
            if (filters.categoria) params.append('categoria', filters.categoria);
            if (filters.search) params.append('search', filters.search);

            const response = await fetch(
                `${API_BASE}/tickets?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Error al cargar tickets');
            }

            const data = await response.json();

            // Sanitizar datos del servidor por precaución
            const sanitizedTickets = data.map((t: Ticket) => ({
                ...t,
                titulo: sanitizeText(t.titulo),
                descripcion: sanitizeText(t.descripcion),
            }));

            setTickets(sanitizedTickets);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id: string) => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE}/tickets/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setTickets(prev => prev.filter(t => t.id !== id));
            }
        } catch (err) {
            setError('Error al eliminar ticket');
        }
    };

    const handleStatusChange = async (id: string, status: TicketStatus) => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE}/tickets/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: status }),
            });

            if (response.ok) {
                setTickets(prev =>
                    prev.map(t => t.id === id ? { ...t, estado: status } : t)
                );
            }
        } catch (err) {
            setError('Error al cambiar estado');
        }
    };

    return {
        tickets,
        loading,
        error,
        filters,
        setFilters,
        handleDelete,
        handleRefresh: fetchData,
        handleStatusChange,
    };
};
