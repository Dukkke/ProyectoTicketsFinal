'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/lib/api';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserEmail(user.email);
        } else {
            router.push('/login');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await changePassword({
                email: userEmail,
                current_password: currentPassword,
                new_password: newPassword
            });

            setSuccess('Contraseña actualizada correctamente. Redirigiendo...');

            // Clear flag in local storage and update if possible
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                user.must_change_password = false;
                localStorage.setItem('user', JSON.stringify(user));
            }

            setTimeout(() => {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const role = user.role.toLowerCase();
                    const modality = (user.modality || '').toLowerCase(); // 'diurna', 'vespertina', 'remota vespertina'

                    if (role === 'estudiante') {
                        if (modality.includes('vespertina')) {
                            router.push('/estudiante-vespertino');
                        } else {
                            router.push('/estudiante');
                        }
                    }
                    else if (role === 'academico') router.push('/academico');
                    else if (role === 'coordinador') router.push('/coordinador');
                    else if (role === 'admin') router.push('/admin');
                    else router.push('/login'); // Fallback
                } else {
                    router.push('/login');
                }
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #eef2ff 50%, #f5f3ff 100%)',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '48px',
                borderRadius: '24px',
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '480px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: '#e0e7ff',
                        color: '#4f46e5',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        margin: '0 auto 16px auto'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                        Cambio de Contraseña
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '15px' }}>
                        Por seguridad, debes establecer una nueva contraseña para tu cuenta.
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontSize: '14px',
                        textAlign: 'center',
                        fontWeight: '500'
                    }}>
                        <AlertTriangle size={16} /> {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        background: '#dcfce7',
                        border: '1px solid #bbf7d0',
                        color: '#166534',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontSize: '14px',
                        textAlign: 'center',
                        fontWeight: '500'
                    }}>
                        <CheckCircle size={16} /> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                            Contraseña Actual
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                color: '#1e293b'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Mínimo 6 caracteres"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                color: '#1e293b'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                            Confirmar Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Repite tu nueva contraseña"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                color: '#1e293b'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '12px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                            color: 'white',
                            padding: '16px',
                            borderRadius: '16px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
                        onMouseUp={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                        onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}
