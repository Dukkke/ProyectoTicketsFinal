import React from 'react';
import { Ticket } from '@/lib/api';
import styles from './TicketList.module.css';
import { Ticket as TicketIcon, Clock, MessageCircle, Briefcase, CheckCircle2 } from 'lucide-react';


interface TicketListProps {
    tickets: Ticket[];
    filter: 'activos' | 'archivados';
    onFilterChange: (filter: 'activos' | 'archivados') => void;
    onTicketClick: (ticket: Ticket) => void;
    onCreateTicketClick: () => void;
}

export const TicketList: React.FC<TicketListProps> = ({
    tickets,
    filter,
    onFilterChange,
    onTicketClick,
    onCreateTicketClick
}) => {

    const filteredTickets = tickets.filter(t => {
        if (filter === 'activos') return !t.is_archived && !t.is_deleted;
        if (filter === 'archivados') return t.is_archived && !t.is_deleted;
        return true;
    });

    const getStatusStyle = (status: string) => {
        const stylesMap: Record<string, { bg: string; color: string; label: string }> = {
            pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
            respondido: { bg: '#dbeafe', color: '#1e40af', label: 'Respondido' },
            solucionado: { bg: '#dcfce7', color: '#166534', label: 'Solucionado' },
            aceptado: { bg: '#dbeafe', color: '#1e40af', label: 'Aceptado' },
            rechazado: { bg: '#fee2e2', color: '#b91c1c', label: 'Rechazado' },
            completado: { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
            derivado: { bg: '#e0e7ff', color: '#4338ca', label: 'Derivado' },
        };
        return stylesMap[status] || stylesMap.pendiente;
    };

    return (
        <>
            {/* Stats Widgets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '40px' }}>
                {/* Total */}
                <div style={{
                    flex: '1 1 180px', background: 'white', padding: '24px',
                    borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                            background: '#e0f2fe', color: '#0ea5e9'
                        }}>
                            <TicketIcon size={24} />
                        </div>
                        <span style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                            {tickets.length}
                        </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Total Tickets</span>
                </div>

                {/* Pendientes */}
                <div style={{
                    flex: '1 1 180px', background: 'white', padding: '24px',
                    borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                            background: '#fef3c7', color: '#d97706'
                        }}>
                            <Clock size={24} />
                        </div>
                        <span style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                            {tickets.filter(t => t.status === 'pendiente').length}
                        </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Pendientes</span>
                </div>

                {/* Respondidos */}
                <div style={{
                    flex: '1 1 180px', background: 'white', padding: '24px',
                    borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                            background: '#dbeafe', color: '#2563eb'
                        }}>
                            <MessageCircle size={24} />
                        </div>
                        <span style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                            {tickets.filter(t => t.status === 'respondido').length}
                        </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Respondidos</span>
                </div>

                {/* En Gestión (Derivado) */}
                <div style={{
                    flex: '1 1 180px', background: 'white', padding: '24px',
                    borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                            background: '#e0e7ff', color: '#4f46e5'
                        }}>
                            <Briefcase size={24} />
                        </div>
                        <span style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                            {tickets.filter(t => t.status === 'derivado').length}
                        </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>En Gestión</span>
                </div>

                {/* Solucionados */}
                <div style={{
                    flex: '1 1 180px', background: 'white', padding: '24px',
                    borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                            background: '#dcfce7', color: '#16a34a'
                        }}>
                            <CheckCircle2 size={24} />
                        </div>
                        <span style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                            {tickets.filter(t => ['solucionado', 'completado', 'resuelto'].includes(t.status)).length}
                        </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Solucionados</span>
                </div>
            </div>

            {/* Ticket Filters */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <button
                    onClick={() => onFilterChange('activos')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background: filter === 'activos' ? '#1e293b' : 'white',
                        color: filter === 'activos' ? 'white' : '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Activos
                </button>
                <button
                    onClick={() => onFilterChange('archivados')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background: filter === 'archivados' ? '#1e293b' : 'white',
                        color: filter === 'archivados' ? 'white' : '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Archivados
                </button>
            </div>

            {/* Tickets List */}
            {filteredTickets.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {filteredTickets.map(ticket => {
                        const statusStyle = getStatusStyle(ticket.status);
                        return (
                            <div key={ticket.id} className={styles.ticketCard} onClick={() => onTicketClick(ticket)} style={{ cursor: 'pointer' }}>
                                <div className={styles.ticketHeader}>
                                    <span className={styles.ticketCode}>{ticket.ticket_code}</span>
                                    <span className={styles.ticketBadge} style={{
                                        background: statusStyle.bg,
                                        color: statusStyle.color
                                    }}>
                                        {statusStyle.label}
                                    </span>
                                </div>
                                <h3 className={styles.ticketTitle}>{ticket.title}</h3>
                                <div className={styles.ticketFooter}>
                                    <span className={styles.ticketDate}>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Ver Detalle &rarr;</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}></div>
                    <p>No tienes tickets {filter === 'activos' ? 'activos' : 'archivados'}.</p>
                    <button className={styles.createEmptyBtn} onClick={onCreateTicketClick}>
                        Crear nuevo ticket
                    </button>
                </div>
            )}
        </>
    );
};
