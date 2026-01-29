import { useState, useEffect } from 'react';
import { User, updateProfile } from '@/lib/api';

interface StudentOnboardingModalProps {
    isOpen: boolean;
    user: User | null;
    onSuccess: (updatedUser: User) => void;
}

export function StudentOnboardingModal({ isOpen, user, onSuccess }: StudentOnboardingModalProps) {
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
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white', borderRadius: '24px',
                width: '90%', maxWidth: '600px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease-out',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ padding: '32px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                        ¡Bienvenido/a, {user.name.split(' ')[0]}! 🎓
                    </h2>
                    <p style={{ opacity: 0.9, lineHeight: '1.5', fontSize: '14px' }}>
                        Para continuar, necesitamos completar tu ficha de estudiante.
                        Esta información es única y nos ayuda a contactarte.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {error && (
                        <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', fontSize: '14px', fontWeight: '500' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                                NOMBRES *
                            </label>
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                style={inputStyle}
                                placeholder="Tus nombres"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                                RUT *
                            </label>
                            <input
                                value={form.rut}
                                onChange={e => setForm({ ...form, rut: e.target.value })}
                                style={inputStyle}
                                placeholder="12.345.678-K"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                                APELLIDO PATERNO *
                            </label>
                            <input
                                value={form.paternal_surname}
                                onChange={e => setForm({ ...form, paternal_surname: e.target.value })}
                                style={inputStyle}
                                placeholder="Apellido Paterno"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                                APELLIDO MATERNO *
                            </label>
                            <input
                                value={form.maternal_surname}
                                onChange={e => setForm({ ...form, maternal_surname: e.target.value })}
                                style={inputStyle}
                                placeholder="Apellido Materno"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                                AÑO INGRESO *
                            </label>
                            <input
                                type="number"
                                value={form.admission_year}
                                onChange={e => setForm({ ...form, admission_year: parseInt(e.target.value) || new Date().getFullYear() })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                                CORREO PERSONAL
                            </label>
                            <input
                                type="email"
                                value={form.personal_email}
                                onChange={e => setForm({ ...form, personal_email: e.target.value })}
                                style={inputStyle}
                                placeholder="nombre@gmail.com"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                                NÚMERO PERSONAL
                            </label>
                            <input
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                style={inputStyle}
                                placeholder="+56 9..."
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                                NÚMERO EMERGENCIA
                            </label>
                            <input
                                value={form.emergency_phone}
                                onChange={e => setForm({ ...form, emergency_phone: e.target.value })}
                                style={inputStyle}
                                placeholder="+56 9..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            marginTop: '12px',
                            padding: '16px', borderRadius: '16px', border: 'none',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                            transition: 'transform 0.1s',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? 'Guardando...' : 'Completar Registro ✨'}
                    </button>

                </form>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '12px',
    border: '2px solid #e2e8f0', fontSize: '14px',
    outline: 'none', transition: 'border-color 0.2s',
    background: '#f8fafc'
};
