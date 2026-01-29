import React, { useState } from 'react';
import { Ticket, resolveTicket } from '@/lib/api';
import styles from './RatingModal.module.css';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: Ticket;
    onRateSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

export default function RatingModal({ isOpen, onClose, ticket, onRateSuccess, onError }: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await resolveTicket(ticket.id, rating, ratingComment || undefined);
            onRateSuccess('¡Gracias por tu valoración!');
            setRating(0);
            setRatingComment('');
            onClose();
        } catch (err) {
            onError('Error al enviar valoración');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} ${styles.ratingModalContent}`} style={{ maxWidth: '500px' }}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalIcon}>⭐</div>
                    <h2 className={styles.modalTitle}>Valora el Servicio</h2>
                    <p className={styles.modalSubtitle}>Tu opinión nos ayuda a mejorar</p>
                </div>

                <div className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={styles.starButton}
                            style={{
                                color: star <= rating ? '#fbbf24' : '#e2e8f0'
                            }}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <textarea
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="Comentarios adicionales (opcional)"
                    className={styles.textarea}
                    style={{ minHeight: '100px', marginBottom: '24px' }}
                />

                <div className={styles.buttonGroup}>
                    <button
                        onClick={() => { onClose(); setRating(0); setRatingComment(''); }}
                        className={styles.cancelButton}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className={styles.submitButton}
                        style={{
                            background: rating === 0 || isSubmitting ? '#cbd5e1' : '#fbbf24',
                            cursor: rating === 0 || isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Valoración'}
                    </button>
                </div>
            </div>
        </div>
    );
}
