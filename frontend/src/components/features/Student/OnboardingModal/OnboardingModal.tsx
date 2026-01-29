import React, { useState, useEffect } from 'react';
import { User, updateProfile } from '@/lib/api';
import styles from './OnboardingModal.module.css';

interface OnboardingModalProps {
    isOpen: boolean;
    user: User | null;
    onSuccess: (updatedUser: User) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, user, onSuccess }) => {
    const [form, setForm] = useState({
        name: '',
        paternal_surname: '',
        maternal_surname: '',
        rut: '',
        admission_year: new Date().getFullYear(),
        phone: '',
        emergency_phone: '',
        personal_email: ''
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                paternal_surname: user.paternal_surname || '',
                maternal_surname: user.maternal_surname || '',
                rut: user.rut || '',
                admission_year: user.admission_year || new Date().getFullYear(),
                phone: user.phone || '',
                emergency_phone: user.emergency_phone || '',
                personal_email: user.personal_email || ''
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            // Validation
            if (!form.name.trim() || !form.paternal_surname.trim() || !form.maternal_surname.trim() || !form.rut.trim()) {
                throw new Error('Por favor completa los campos obligatorios (*)');
            }

            const updatedUser = await updateProfile(user.id, form);
            onSuccess(updatedUser);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar los datos');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div style={{ padding: '32px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', margin: '-40px -40px 32px -40px', borderBottom: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                        ¡Bienvenido/a, {user.name.split(' ')[0]}! 🎓
                    </h2>
                    <p style={{ opacity: 0.9, lineHeight: '1.5', fontSize: '14px' }}>
                        Para continuar, necesitamos completar tu ficha de estudiante.
                        Esta información es única y nos ayuda a contactarte.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className={styles.errorMessage}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>NOMBRES *</label>
                            <input
                                className={styles.input}
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Tus nombres"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>RUT *</label>
                            <input
                                className={styles.input}
                                value={form.rut}
                                onChange={e => setForm({ ...form, rut: e.target.value })}
                                placeholder="12.345.678-K"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>APELLIDO PATERNO *</label>
                            <input
                                className={styles.input}
                                value={form.paternal_surname}
                                onChange={e => setForm({ ...form, paternal_surname: e.target.value })}
                                placeholder="Apellido Paterno"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>APELLIDO MATERNO *</label>
                            <input
                                className={styles.input}
                                value={form.maternal_surname}
                                onChange={e => setForm({ ...form, maternal_surname: e.target.value })}
                                placeholder="Apellido Materno"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>AÑO INGRESO *</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={form.admission_year}
                                onChange={e => setForm({ ...form, admission_year: parseInt(e.target.value) || new Date().getFullYear() })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>CORREO PERSONAL</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={form.personal_email}
                                onChange={e => setForm({ ...form, personal_email: e.target.value })}
                                placeholder="nombre@gmail.com"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>NÚMERO PERSONAL</label>
                            <input
                                className={styles.input}
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                placeholder="+56 9..."
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>NÚMERO EMERGENCIA</label>
                            <input
                                className={styles.input}
                                value={form.emergency_phone}
                                onChange={e => setForm({ ...form, emergency_phone: e.target.value })}
                                placeholder="+56 9..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnSubmit}
                    >
                        {saving ? 'Guardando...' : 'Completar Registro ✨'}
                    </button>
                </form>
            </div>
        </div>
    );
};
