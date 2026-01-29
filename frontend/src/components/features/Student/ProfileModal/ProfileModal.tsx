import React, { useState, useEffect } from 'react';
import { User, updateUser } from '@/lib/api';
import styles from './ProfileModal.module.css';
import { X } from 'lucide-react';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSuccess: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
    const [profileForm, setProfileForm] = useState({
        name: '',
        paternal_surname: '',
        maternal_surname: '',
        rut: '',
        phone: '',
        emergency_phone: '',
        personal_email: '',
        admission_year: new Date().getFullYear(),
        new_password: '',
        confirm_password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            setProfileForm({
                name: user.name || '',
                paternal_surname: user.paternal_surname || '',
                maternal_surname: user.maternal_surname || '',
                rut: user.rut || '',
                phone: user.phone || '',
                emergency_phone: user.emergency_phone || '',
                personal_email: user.personal_email || '',
                admission_year: user.admission_year || new Date().getFullYear(),
                new_password: '',
                confirm_password: ''
            });
            setError('');
            setSuccessMsg('');
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            const updateData: any = {
                name: profileForm.name,
                paternal_surname: profileForm.paternal_surname,
                maternal_surname: profileForm.maternal_surname,
                rut: profileForm.rut,
                phone: profileForm.phone,
                emergency_phone: profileForm.emergency_phone,
                personal_email: profileForm.personal_email,
                admission_year: profileForm.admission_year
            };

            if (profileForm.new_password) {
                updateData.password = profileForm.new_password;
            }

            const updatedUser = await updateUser(user.id, updateData);
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
            setSuccessMsg('Perfil actualizado correctamente');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al actualizar perfil');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.closeModalBtn} onClick={onClose}><X /></button>
                <div style={{ textAlign: 'center' }}>
                    <div className={styles.userAvatar}>
                        {user.name.charAt(0)}
                    </div>
                    <h2 className={styles.modalTitle}>Mis Datos</h2>
                </div>

                {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
                {successMsg && <div style={{ padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>{successMsg}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nombres</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={profileForm.name}
                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Apellido Paterno</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={profileForm.paternal_surname}
                                onChange={e => setProfileForm({ ...profileForm, paternal_surname: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Apellido Materno</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={profileForm.maternal_surname}
                                onChange={e => setProfileForm({ ...profileForm, maternal_surname: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>RUT</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={profileForm.rut}
                            onChange={e => setProfileForm({ ...profileForm, rut: e.target.value })}
                            readOnly // RUT usually shouldn't be changed by user freely
                            style={{ background: '#f1f5f9' }}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Personal</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={profileForm.personal_email}
                            onChange={e => setProfileForm({ ...profileForm, personal_email: e.target.value })}
                            placeholder="tucorreo@gmail.com"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Teléfono</label>
                            <input
                                type="tel"
                                className={styles.input}
                                value={profileForm.phone}
                                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Teléfono Emergencia</label>
                            <input
                                type="tel"
                                className={styles.input}
                                value={profileForm.emergency_phone}
                                onChange={e => setProfileForm({ ...profileForm, emergency_phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#64748b' }}>Cambiar Contraseña</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nueva Contraseña</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={profileForm.new_password}
                                onChange={e => setProfileForm({ ...profileForm, new_password: e.target.value })}
                                placeholder="Dejar en blanco para mantener"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Confirmar Contraseña</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={profileForm.confirm_password}
                                onChange={e => setProfileForm({ ...profileForm, confirm_password: e.target.value })}
                                placeholder="Repetir nueva contraseña"
                            />
                        </div>
                    </div>

                    <div className={styles.modalButtons}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                        <button type="submit" className={styles.btnSubmit} disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
