import React, { useState } from 'react';
import { Ticket, reopenTicket } from '@/lib/api';
import styles from './ReopenModal.module.css';

interface ReopenModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: Ticket;
    onReopenSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

export default function ReopenModal({ isOpen, onClose, ticket, onReopenSuccess, onError }: ReopenModalProps) {
    const [reopenReason, setReopenReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!reopenReason.trim()) return;
        setIsSubmitting(true);
        try {
            await reopenTicket(ticket.id, reopenReason);
            onReopenSuccess('Ticket reabierto correctamente');
            setReopenReason('');
            onClose();
        } catch (err) {
            onError('Error al reabrir ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} ${styles.reopenModalContent}`} style={{ maxWidth: '500px' }}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalIcon}>🔄</div>
                    <h2 className={styles.modalTitle}>Reabrir Ticket</h2>
                    <p className={styles.modalSubtitle}>¿Por qué necesitas reabrir este ticket?</p>
                </div>

                <textarea
                    value={reopenReason}
                    onChange={e => setReopenReason(e.target.value)}
                    placeholder="Explica el motivo de la reapertura..."
                    className={styles.textarea}
                    style={{ minHeight: '120px', marginBottom: '24px' }}
                />

                <div className={styles.buttonGroup}>
                    <button
                        onClick={() => { onClose(); setReopenReason(''); }}
                        className={styles.cancelButton}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reopenReason.trim() || isSubmitting}
                        className={styles.submitButton}
                        style={{
                            background: !reopenReason.trim() || isSubmitting ? '#cbd5e1' : '#f59e0b',
                            cursor: !reopenReason.trim() || isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? 'Reabriendo...' : 'Reabrir Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
}
