import React from 'react';
import { User } from '@/lib/api';
import styles from './PortalHeader.module.css';

interface PortalHeaderProps {
    user: User | null;
    onLogout: () => void;
    onOpenSettings?: () => void;
}

export default function PortalHeader({ user, onLogout, onOpenSettings }: PortalHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <span className={styles.logoBlue} style={{ fontWeight: '800' }}>Te ayudamos FIN</span>
                <span className={styles.badge}>
                    {user?.role === 'coordinador' ? 'Coordinación' :
                        user?.role === 'admin' ? 'Administración' :
                            user?.role === 'academico' ? 'Académico' :
                                'Estudiante'}
                </span>
            </div>
            <div className={styles.headerControls}>
                <div className={styles.userInfo}>
                    {user?.name}
                </div>
                {onOpenSettings && (
                    <button
                        onClick={onOpenSettings}
                        className={styles.settingsButton}
                        title="Configuración de Perfil"
                    >
                        ⚙️ Mis Datos
                    </button>
                )}
                <button onClick={onLogout} className={styles.logoutButton}>
                    Cerrar Sesión
                </button>
            </div>
        </header>
    );
}
