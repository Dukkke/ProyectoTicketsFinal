import React from 'react';
import styles from './FAQModal.module.css';

interface FAQModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon: string;
    description: string;
    questions: string[];
    generalResponse: React.ReactNode;
    images?: string[];
    video?: string;
    onCreateTicket?: () => void;
}

export default function FAQModal({
    isOpen,
    onClose,
    title,
    icon,
    description,
    questions,
    generalResponse,
    images,
    video,
    onCreateTicket
}: FAQModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
                    ✕
                </button>

                {/* Header con gradiente dinámico */}
                <div className={styles.header}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    <div>
                        <h2 className={styles.title}>{title}</h2>
                        <p className={styles.subtitle}>{description}</p>
                    </div>
                </div>

                <div className={styles.content}>
                    {/* Sección de preguntas con animación escalonada */}
                    {questions && questions.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                Preguntas FRECUENTES:
                            </h3>
                            <ul className={styles.questionList}>
                                {questions.map((q, i) => (
                                    <li
                                        key={i}
                                        className={styles.questionItem}
                                        style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                                    >
                                        {q}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Respuesta principal */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            RESPUESTA GENERAL / SOLUCIÓN:
                        </h3>
                        {/* We use specific class for styling list items if needed */}
                        <div className={styles.responseContent}>
                            {generalResponse}
                        </div>
                    </div>

                    {/* Video explicativo */}
                    {video && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                Video Tutorial
                            </h3>
                            <div className={styles.videoContainer}>
                                <video
                                    controls
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    preload="metadata"
                                    poster="/images/video-poster.jpg"
                                >
                                    <source src={video} type="video/mp4" />
                                    Tu navegador no soporta la reproducción de video.
                                </video>
                            </div>
                        </div>
                    )}

                    {/* Imágenes de referencia */}
                    {images && images.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                Imágenes de Referencia
                            </h3>
                            <div className={styles.imageGrid}>
                                {images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt={`Referencia ${i + 1}`}
                                        className={styles.referenceImage}
                                        onClick={() => window.open(img, '_blank')}
                                        loading="lazy"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Ticket Call to Action */}
                    <div className={styles.section} style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ marginBottom: '12px', color: '#64748b' }}>¿No encontraste la solución?</p>
                        <button
                            className={styles.actionButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(); // Close FAQ Modal
                                if (onCreateTicket) onCreateTicket(); // Open Create Ticket Modal
                            }}
                            style={{ width: '100%', justifyContent: 'center', background: '#4f46e5' }}
                        >
                            Ingresar aquí para generar Ticket
                        </button>
                    </div>
                </div>

                {/* Footer con botones mejorados */}
                <div className={styles.footer}>
                    <button className={styles.actionButton} onClick={onClose} style={{ background: '#94a3b8' }}>
                        Entendido / Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
