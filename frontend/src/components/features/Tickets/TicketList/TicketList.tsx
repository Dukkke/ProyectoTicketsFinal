import React, { useState, useEffect } from 'react';
import { Ticket } from '@/lib/api';
import styles from './TicketList.module.css';

interface TicketListProps {
    tickets: Ticket[];
    onOpenChat: (ticket: Ticket) => void;
    onRate: (ticket: Ticket) => void;
    onReopen: (ticket: Ticket) => void;
}

export default function TicketList({ tickets, onOpenChat, onRate, onReopen }: TicketListProps) {
    const [archivedIds, setArchivedIds] = useState<number[]>([]);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('archived_tickets');
        if (stored) {
            setArchivedIds(JSON.parse(stored));
        }
    }, []);

    const handleArchive = (ticketId: number) => {
        const newArchived = [...archivedIds, ticketId];
        setArchivedIds(newArchived);
        localStorage.setItem('archived_tickets', JSON.stringify(newArchived));
    };

    const handleUnarchive = (ticketId: number) => {
        const newArchived = archivedIds.filter(id => id !== ticketId);
        setArchivedIds(newArchived);
        localStorage.setItem('archived_tickets', JSON.stringify(newArchived));
    };

    const getStatusStyle = (status: string) => {
        const lowerStatus = status?.toLowerCase() || 'pendiente';
        const styles: Record<string, { bg: string; color: string; label: string }> = {
            pendiente: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pendiente' },
            respondido: { bg: '#dbeafe', color: '#1e40af', label: '💬 Respondido' },
            solucionado: { bg: '#dcfce7', color: '#166534', label: '✅ Solucionado' },
            derivado: { bg: '#f3e8ff', color: '#7c3aed', label: '↗️ Derivado' },
            aceptado: { bg: '#e0f2fe', color: '#0369a1', label: '👍 Aceptado' },
            rechazado: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rechazado' },
            completado: { bg: '#d1fae5', color: '#065f46', label: '🎉 Completado' },
        };
        return styles[lowerStatus] || styles.pendiente;
    };

    const activeTickets = tickets.filter(t => !archivedIds.includes(t.id));
    const archivedTickets = tickets.filter(t => archivedIds.includes(t.id));

    if (tickets.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎫</div>
                <p className={styles.emptyText}>¡Aún no tienes tickets!</p>
                <p className={styles.emptySubtext}>Cuando generes uno, aparecerá aquí</p>
            </div>
        );
    }

    return (
        <div className={styles.ticketsSection}>
            <div className={styles.ticketsHeader}>
                <h2 className={styles.ticketsTitle}>
                    🎫 Mis Tickets
                    {activeTickets.length > 0 && (
                        <span className={styles.ticketCount}>{activeTickets.length}</span>
                    )}
                </h2>
                {archivedTickets.length > 0 && (
                    <button
                        className={styles.toggleArchiveBtn}
                        onClick={() => setShowArchived(!showArchived)}
                    >
                        {showArchived ? '🔼 Ocultar archivados' : `📁 Ver archivados (${archivedTickets.length})`}
                    </button>
                )}
            </div>

            {activeTickets.length === 0 && !showArchived && (
                <div className={styles.allArchivedMessage}>
                    <p>✨ ¡Todos tus tickets están archivados!</p>
                    <button onClick={() => setShowArchived(true)} className={styles.showArchivedLink}>
                        Ver tickets archivados →
                    </button>
                </div>
            )}

            <div className={styles.ticketsList}>
                {activeTickets.map(ticket => {
                    const statusStyle = getStatusStyle(ticket.status);
                    const isSolved = ticket.status === 'solucionado' || ticket.status === 'completado';
                    return (
                        <div key={ticket.id} className={`${styles.ticketCard} ${isSolved ? styles.solvedCard : ''}`}>
                            <div className={styles.ticketHeader}>
                                <span style={{
                                    background: statusStyle.bg,
                                    color: statusStyle.color,
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '700'
                                }}>
                                    {statusStyle.label}
                                </span>
                                <span className={styles.ticketDate}>
                                    {new Date(ticket.created_at).toLocaleDateString('es-CL')}
                                </span>
                            </div>
                            <h3 className={styles.ticketTitle}>
                                {ticket.title}
                            </h3>
                            <p className={styles.ticketDescription}>
                                {ticket.description}
                            </p>
                            {ticket.coordinator_response && (
                                <div className={styles.coordinatorResponse}>
                                    <p style={{ fontSize: '13px', color: '#475569' }}>
                                        <strong>💬 Respuesta:</strong> {ticket.coordinator_response}
                                    </p>
                                </div>
                            )}
                            <div className={styles.ticketActions}>
                                <button
                                    onClick={() => onOpenChat(ticket)}
                                    className={styles.chatButton}
                                >
                                    💬 Ver Chat
                                </button>

                                {/* Show actions for Respondido tickets (to resolve or reopen) */}
                                {ticket.status === 'respondido' && (
                                    <>
                                        <button
                                            onClick={() => onRate(ticket)}
                                            className={styles.rateButton}
                                            style={{ backgroundColor: '#10b981', color: 'white' }}
                                        >
                                            ✅ Confirmar Solución
                                        </button>
                                        <button
                                            onClick={() => onReopen(ticket)}
                                            className={styles.reopenButton}
                                        >
                                            🔄 Tengo dudas
                                        </button>
                                    </>
                                )}

                                {/* Show Rate button for Solved tickets if not rated yet */}
                                {isSolved && !ticket.satisfaction_rating && (
                                    <button
                                        onClick={() => onRate(ticket)}
                                        className={styles.rateButton}
                                    >
                                        ⭐ Valorar Atención
                                    </button>
                                )}

                                {/* Show Archive for Solved tickets - NO Reopen */}
                                {isSolved && (
                                    <button
                                        onClick={() => handleArchive(ticket.id)}
                                        className={styles.archiveButton}
                                        title="Archivar ticket"
                                    >
                                        📁 Archivar
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Archived Tickets Section */}
            {showArchived && archivedTickets.length > 0 && (
                <div className={styles.archivedSection}>
                    <h3 className={styles.archivedTitle}>📁 Tickets Archivados</h3>
                    <div className={styles.ticketsList}>
                        {archivedTickets.map(ticket => {
                            const statusStyle = getStatusStyle(ticket.status);
                            return (
                                <div key={ticket.id} className={`${styles.ticketCard} ${styles.archivedCard}`}>
                                    <div className={styles.ticketHeader}>
                                        <span style={{
                                            background: statusStyle.bg,
                                            color: statusStyle.color,
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '700'
                                        }}>
                                            {statusStyle.label}
                                        </span>
                                        <span className={styles.ticketDate}>
                                            {new Date(ticket.created_at).toLocaleDateString('es-CL')}
                                        </span>
                                    </div>
                                    <h3 className={styles.ticketTitle}>{ticket.title}</h3>
                                    <div className={styles.ticketActions}>
                                        <button
                                            onClick={() => handleUnarchive(ticket.id)}
                                            className={styles.unarchiveButton}
                                        >
                                            ↩️ Restaurar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
