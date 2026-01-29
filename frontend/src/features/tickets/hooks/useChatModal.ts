// src/features/tickets/hooks/useChatModal.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { sanitizeText } from '@/security';
import { chatMessageSchema, validate } from '@/security/validation';
import type { TicketMessage } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UseChatModalReturn {
    messages: TicketMessage[];
    loading: boolean;
    sending: boolean;
    error: string | null;
    newMessage: string;
    setNewMessage: (msg: string) => void;
    sendMessage: () => Promise<void>;
    refreshMessages: () => void;
}

export const useChatModal = (ticketId: string): UseChatModalReturn => {
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');

    // Para auto-refresh
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token || !ticketId) return;

            const response = await fetch(
                `${API_BASE}/tickets/${ticketId}/messages`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                // Sanitizar mensajes
                const sanitized = data.map((m: TicketMessage) => ({
                    ...m,
                    contenido: sanitizeText(m.contenido),
                    autorNombre: sanitizeText(m.autorNombre),
                }));
                setMessages(sanitized);
            }
        } catch {
            setError('Error al cargar mensajes');
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    // Cargar mensajes iniciales y configurar auto-refresh
    useEffect(() => {
        if (ticketId) {
            fetchMessages();

            // Auto-refresh cada 10 segundos
            intervalRef.current = setInterval(fetchMessages, 10000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [ticketId, fetchMessages]);

    const sendMessage = async () => {
        // Validar mensaje
        const validation = validate(chatMessageSchema, { contenido: newMessage });
        if (!validation.success) {
            setError(validation.errors[0]);
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('No autenticado');
            return;
        }

        try {
            setSending(true);
            setError(null);

            const response = await fetch(
                `${API_BASE}/tickets/${ticketId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contenido: sanitizeText(newMessage)
                    }),
                }
            );

            if (response.ok) {
                setNewMessage('');
                // Recargar mensajes para obtener el nuevo
                await fetchMessages();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Error al enviar mensaje');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar');
        } finally {
            setSending(false);
        }
    };

    return {
        messages,
        loading,
        sending,
        error,
        newMessage,
        setNewMessage,
        sendMessage,
        refreshMessages: fetchMessages,
    };
};
