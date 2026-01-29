import React, { useState } from 'react';
import { User, Academic, createTicket } from '@/lib/api';
import styles from './CreateTicketModal.module.css';

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    academics: Academic[];
    onTicketCreated: (msg: string) => void;
    onError: (msg: string) => void;
}

export default function CreateTicketModal({ isOpen, onClose, user, academics, onTicketCreated, onError }: CreateTicketModalProps) {
    const [ticketForm, setTicketForm] = useState({
        title: '',
        description: '',
        ticket_type: 'academica',
        academic_id: 0
    });
    const [academicSearch, setAcademicSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const filteredAcademics = academics.filter(a =>
        a.name.toLowerCase().includes(academicSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createTicket(user.id, {
                title: ticketForm.title,
                description: ticketForm.description,
                ticket_type: ticketForm.ticket_type,
                academic_id: ticketForm.academic_id || undefined
            });

            onTicketCreated('¡Ticket creado exitosamente!');
            onClose();
            // Reset form
            setTicketForm({
                title: '',
                description: '',
                ticket_type: 'academica',
                academic_id: 0
            });
            setAcademicSearch('');
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Error al crear ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalIcon}>📝</div>
                    <h2 className={styles.modalTitle}>Nuevo Ticket</h2>
                    <p className={styles.modalSubtitle}>Describe tu solicitud para ayudarte.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Título</label>
                            <input
                                required
                                value={ticketForm.title}
                                onChange={e => setTicketForm({ ...ticketForm, title: e.target.value })}
                                placeholder="Ej: Consulta sobre matrícula"
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tipo de Consulta</label>
                            <select
                                value={ticketForm.ticket_type}
                                onChange={e => setTicketForm({ ...ticketForm, ticket_type: e.target.value })}
                                className={styles.select}
                            >
                                <option value="academica">Académica</option>
                                <option value="vocacional">Vocacional</option>
                                <option value="administrativa">Administrativa</option>
                                <option value="horario">Horario</option>
                                <option value="otra">Otra</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Académico (opcional)</label>
                            {/* Search input for academics */}
                            <div className={styles.academicSearchContainer}>
                                <input
                                    type="text"
                                    value={academicSearch}
                                    onChange={e => setAcademicSearch(e.target.value)}
                                    placeholder="🔍 Buscar académico por nombre..."
                                    className={styles.input}
                                    style={{ paddingLeft: '16px' }}
                                />
                                {academicSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setAcademicSearch('')}
                                        className={styles.searchClearButton}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {/* Academic list with selection */}
                            <div className={styles.academicList}>
                                {/* Option to not select any academic */}
                                <div
                                    onClick={() => setTicketForm({ ...ticketForm, academic_id: 0 })}
                                    className={`${styles.academicItem} ${ticketForm.academic_id === 0 ? styles.academicItemSelected : ''}`}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>Coordinación Académica</span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            {user.modality === 'Vespertina' ? 'Atención: Giannina' : 'Atención: Cynthia o Margarita'}
                                        </span>
                                    </div>
                                </div>
                                {filteredAcademics.length === 0 ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                                        No se encontraron académicos
                                    </div>
                                ) : (
                                    filteredAcademics.map(a => (
                                        <div
                                            key={a.id}
                                            onClick={() => setTicketForm({ ...ticketForm, academic_id: a.id })}
                                            className={`${styles.academicItem} ${ticketForm.academic_id === a.id ? styles.academicItemSelected : ''}`}
                                        >
                                            <div className={`${styles.academicAvatar} ${ticketForm.academic_id === a.id ? styles.academicAvatarSelected : ''}`}>
                                                {a.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={styles.academicInfoName}>{a.name}</div>
                                                {a.email && <div className={styles.academicInfoEmail}>{a.email}</div>}
                                            </div>
                                            {ticketForm.academic_id === a.id && (
                                                <span style={{ marginLeft: 'auto', color: '#4f46e5' }}>✓</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                            {ticketForm.academic_id > 0 && (
                                <div className={styles.academicSelectionConfirm}>
                                    ✓ Seleccionado: {academics.find(a => a.id === ticketForm.academic_id)?.name}
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Descripción</label>
                            <textarea
                                required
                                value={ticketForm.description}
                                onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                                placeholder="Describe tu consulta en detalle..."
                                className={styles.textarea}
                            />
                        </div>

                        <div className={styles.buttonGroup}>
                            <button
                                type="button"
                                onClick={() => { onClose(); setAcademicSearch(''); }}
                                className={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={styles.submitButton}
                            >
                                {isSubmitting ? 'Creando...' : 'Crear Ticket'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
