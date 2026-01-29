import React, { useState, useEffect, useRef } from 'react';
import { User, Ticket, TicketMessage, getTicketMessages, sendTicketMessage } from '@/lib/api';
import styles from './ChatModal.module.css';

const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        pendiente: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pendiente' },
        respondido: { bg: '#dbeafe', color: '#1e40af', label: '💬 Respondido' },
        solucionado: { bg: '#dcfce7', color: '#166534', label: '✅ Solucionado' },
        derivado: { bg: '#f3e8ff', color: '#7c3aed', label: '↗️ Derivado' },
        aceptado: { bg: '#e0f2fe', color: '#0369a1', label: '👍 Aceptado' },
        rechazado: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rechazado' },
        completado: { bg: '#d1fae5', color: '#065f46', label: '🎉 Completado' },
    };
    return styles[status] || styles.pendiente;
};

interface ChatModalProps {
    ticket: Ticket;
    user: User;
    onClose: () => void;
    onResolve?: (ticket: Ticket) => void;
}

export default function ChatModal({ ticket, user, onClose, onResolve }: ChatModalProps) {
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check if ticket can be resolved by student (e.g. not already solved)
    const canResolve = onResolve && (ticket.status === 'respondido' || ticket.status === 'derivado' || ticket.status === 'pendiente');

    useEffect(() => {
        loadMessages();
    }, [ticket.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const data = await getTicketMessages(ticket.id);
            setMessages(data);
        } catch (err) {
            console.error('Error loading messages:', err);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        // Check limit: max 3 consecutive student messages
        // const studentMessages = messages.filter(m => m.sender_role === 'estudiante');
        // Simple client-side check if needed

        setSending(true);
        try {
            const sentMsg = await sendTicketMessage(
                ticket.id,
                newMessage.trim(),
                user.id,
                'estudiante'
            );
            setMessages(prev => [...prev, sentMsg]);
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [newMessage]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sending) handleSendMessage();
        }
    };

    const handleSendMessageWrapper = async () => {
        const currentRef = textareaRef.current;
        await handleSendMessage();
        if (currentRef) {
            currentRef.style.height = 'auto';
            currentRef.focus();
        }
    };

    const statusStyle = getStatusStyle(ticket.status);

    const isActive = ['pendiente', 'respondido', 'derivado'].includes(ticket.status);
    const isSolved = ['solucionado', 'completado'].includes(ticket.status);
    const showAction = onResolve && (isActive || (isSolved && !ticket.satisfaction_rating));

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                    <div style={{ flex: 1 }}>
                        <h2 className={styles.chatHeaderTitle} style={{ fontSize: '18px', fontWeight: 'bold' }}>
                            {ticket.title}
                        </h2>
                        <p className={styles.chatHeaderSubtitle} style={{ fontSize: '13px', opacity: 0.9 }}>
                            Ticket #{ticket.ticket_code} • {ticket.escalated_to_academic ? '👨‍🏫 Derivado a Académico' : '👤 Con Coordinación'}
                        </p>
                    </div>

                    {/* Resolve Button in Header */}
                    {showAction && user.role === 'estudiante' && (
                        <button
                            onClick={() => onResolve?.(ticket)}
                            style={{
                                marginRight: '12px',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                border: 'none',
                                background: isActive ? '#10b981' : '#f59e0b', // Green for resolve, amber for valorate
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            title={isActive ? "Marcar como solucionado" : "Valorar atención"}
                        >
                            {isActive ? "✅ Resolver" : "⭐ Valorar"}
                        </button>
                    )}

                    <button onClick={onClose} className={styles.chatCloseButton}>
                        ✕
                    </button>
                </div>

                <div className={styles.chatMessagesArea}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Cargando mensajes...</div>
                    ) : (
                        [
                            // 1. Initial Ticket Description (Always shown as first message)
                            {
                                id: -1, // Virtual ID
                                ticket_id: ticket.id,
                                sender_id: ticket.student_id,
                                sender_role: 'estudiante',
                                sender_name: user.role === 'estudiante' ? user.name : ticket.student_name || 'Estudiante', // Use current user name if student, else ticket data
                                content: ticket.description,
                                created_at: ticket.created_at,
                                is_system_message: false
                            } as TicketMessage,
                            ...messages
                        ].map((msg) => (
                            <div
                                key={msg.id}
                                className={styles.chatMessageRow}
                            >
                                <div className={styles.messageHeader}>
                                    <div
                                        className={styles.chatAvatar}
                                        style={{
                                            backgroundColor: msg.sender_role === 'estudiante' ? '#94a3b8' :
                                                msg.sender_role === 'academico' ? '#f59e0b' : '#3b82f6'
                                        }}
                                    >
                                        {msg.sender_name?.charAt(0)}
                                    </div>
                                    <span className={styles.senderName}>{msg.sender_name}</span>
                                    <span className={`${styles.senderRole} ${msg.sender_role === 'estudiante' ? styles.roleStudent :
                                        msg.sender_role === 'academico' ? styles.roleAcademic :
                                            styles.roleCoordinator
                                        }`}>
                                        {msg.sender_role === 'estudiante' ? 'ESTUDIANTE' :
                                            msg.sender_role === 'academico' ? 'PROFESOR' : 'COORDINACIÓN'}
                                    </span>
                                    <span className={styles.messageTime}>
                                        {new Date(msg.created_at).toLocaleString('es-CL', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className={styles.chatBubble}>
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat input: Only show if user can send messages */}
                {(() => {
                    const canStudentChat = user.role === 'estudiante' && ['respondido', 'derivado'].includes(ticket.status);
                    const canStaffChat = user.role === 'coordinador' || user.role === 'academico';
                    const canChat = canStudentChat || canStaffChat;

                    if (!canChat && user.role === 'estudiante') {
                        return (
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                    ⏳ Espera la respuesta de Coordinación para poder escribir.
                                </p>
                            </div>
                        );
                    }

                    return (
                        <div className={styles.chatInputArea}>
                            <textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe un mensaje..."
                                className={styles.chatInput}
                                rows={1}
                            />
                            <button
                                onClick={handleSendMessageWrapper}
                                disabled={sending || !newMessage.trim()}
                                className={styles.chatSendButton}
                                style={{ opacity: sending || !newMessage.trim() ? 0.5 : 1 }}
                            >
                                {sending ? '...' : '➤'}
                            </button>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
