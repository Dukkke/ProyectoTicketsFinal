import React from 'react';
import styles from './QuickActions.module.css';

interface QuickActionsProps {
    onCreateTicket: () => void;
    ticketCount: number;
}

export default function QuickActions({ onCreateTicket, ticketCount }: QuickActionsProps) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarContent}>
                <h3 className={styles.sidebarTitle}>Acciones Rápidas</h3>

                <button
                    onClick={onCreateTicket}
                    className={styles.createTicketBtn}
                >
                    <div className={styles.btnText}>
                        <span className={styles.btnMain}>Crear Ticket</span>
                        <span className={styles.btnSub}>¿No encontraste tu respuesta?</span>
                    </div>
                </button>

                <div className={styles.statsCard}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{ticketCount}</span>
                        <span className={styles.statLabel}>Tickets activos</span>
                    </div>
                </div>

                <div className={styles.helpBox}>
                    <p className={styles.helpText}>
                        Tip: Revisa primero las <strong>Preguntas Frecuentes</strong> arriba,
                        ¡muchos temas ya están resueltos!
                    </p>
                </div>

                <div className={styles.linksSection}>
                    <a
                        href="https://www.uahurtado.cl/estudiantes/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.externalLink}
                    >
                        Portal Estudiantes UAH
                    </a>
                    <a
                        href="https://ucampus.uahurtado.cl/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.externalLink}
                    >
                        UCampus
                    </a>
                </div>
            </div>
        </aside>
    );
}
