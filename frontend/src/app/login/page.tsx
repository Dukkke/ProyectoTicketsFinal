'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { Presentation, ClipboardList, Settings, Laptop, GraduationCap, AlertTriangle, ArrowLeft } from 'lucide-react';

// UAH Brand Colors
const COLORS = {
    orange: '#F06427',
    orangeDark: '#D94F1A',
    black: '#000000',
    white: '#FFFFFF'
};

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State for role, initialized with param or default, then updated from localStorage
    const [role, setRole] = useState(searchParams.get('role')?.toLowerCase() || 'estudiante');

    useEffect(() => {
        const paramRole = searchParams.get('role')?.toLowerCase();
        if (paramRole) {
            setRole(paramRole);
        } else {
            // If no param, check localStorage
            const storedRole = localStorage.getItem('userRole');
            if (storedRole) {
                setRole(storedRole.toLowerCase());
            }
        }
    }, [searchParams]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Dynamic Text Configuration based on Role
    const getRoleConfig = (r: string) => {
        switch (r) {
            case 'academico':
                return {
                    title: 'Portal Académico',
                    subtitle: 'Gestiona tus clases y estudiantes',
                    placeholder: 'u.apellido@usuarios.uahurtado.cl',
                    icon: <Presentation size={32} />
                };
            case 'coordinador':
                return {
                    title: 'Portal de Coordinación',
                    subtitle: 'Gestión académica y bienestar',
                    placeholder: 'coordinacion@uahurtado.cl',
                    icon: <ClipboardList size={32} />
                };
            case 'admin':
                return {
                    title: 'Administración',
                    subtitle: 'Control total del sistema',
                    placeholder: 'admin@uahurtado.cl',
                    icon: <Settings size={32} />
                };
            case 'estudiante-remoto':
                return {
                    title: 'Portal Estudiantes',
                    subtitle: 'Modalidad Remota',
                    placeholder: 'estudiante@alumnos.uahurtado.cl',
                    icon: <Laptop size={32} />
                };
            default: // Estudiante
                return {
                    title: 'Portal de Estudiantes',
                    subtitle: 'Solicita ayuda y gestiona tus tickets',
                    placeholder: 'estudiante@alumnos.uahurtado.cl',
                    icon: <GraduationCap size={32} />
                };
        }
    };

    const config = getRoleConfig(role);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.must_change_password) {
                router.push('/change-password');
                return;
            }

            const userRole = user.role.toLowerCase();
            const userModality = (user.modality || '').trim().toLowerCase();

            // Handle estudiante-remoto login
            if (role === 'estudiante-remoto' || role === 'estudiante-vespertino') {
                if (userRole !== 'estudiante') {
                    localStorage.removeItem('user');
                    setPassword('');
                    throw new Error('Este portal es exclusivo para estudiantes de modalidad remota.');
                }
                if (!['vespertina', 'modalidad remota', 'remota', 'online'].includes(userModality)) {
                    localStorage.removeItem('user');
                    setPassword('');
                    throw new Error('Tu cuenta no está registrada como modalidad remota. Contacta a coordinación.');
                }
                router.push('/estudiante-remoto');
                return;
            }

            // Strict Role Validation for other roles
            if (role !== userRole) {
                const roleNames: { [key: string]: string } = {
                    'estudiante': 'Estudiante',
                    'academico': 'Académico',
                    'coordinador': 'Coordinador',
                    'admin': 'Administrador'
                };
                localStorage.removeItem('user');
                setPassword('');
                throw new Error(`Acceso denegado. Este portal es para ${roleNames[role]}. Tu cuenta es de ${roleNames[userRole]}.`);
            }

            // For regular estudiante, redirect remota students to their portal
            if (userRole === 'estudiante') {
                if (['vespertina', 'modalidad remota', 'remota', 'online'].includes(userModality)) {
                    router.push('/estudiante-remoto');
                } else {
                    router.push('/estudiante');
                }
            }
            else if (userRole === 'academico') router.push('/academico');
            else if (userRole === 'coordinador') router.push('/coordinador');
            else if (userRole === 'admin') router.push('/admin');
            else router.push('/estudiante');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'url(/Loginnuevo.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Dark Overlay for readability */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(2px)' }}></div>

            {/* Login Card */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                padding: '48px',
                borderRadius: '24px',
                background: COLORS.white,
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                margin: '24px'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '72px', height: '72px', borderRadius: '20px',
                        background: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDark})`,
                        color: 'white', fontSize: '32px', marginBottom: '20px',
                        boxShadow: '0 10px 25px rgba(240, 100, 39, 0.35)'
                    }}>
                        {config.icon}
                    </div>
                    <h1 style={{
                        fontSize: '26px',
                        fontWeight: '800',
                        color: COLORS.black,
                        marginBottom: '8px',
                        letterSpacing: '-0.5px'
                    }}>
                        {config.title}
                    </h1>
                    <p style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>
                        {config.subtitle}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
                        padding: '12px 16px', borderRadius: '12px', fontSize: '14px', textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} method="POST" autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label htmlFor="email" style={{
                            display: 'block', marginBottom: '8px', fontSize: '13px',
                            fontWeight: '700', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>
                            Correo Institucional
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder={config.placeholder}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="off"
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px',
                                border: '2px solid #e5e5e5', background: '#fafafa',
                                color: COLORS.black, fontSize: '15px', outline: 'none', transition: 'all 0.2s'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = COLORS.orange; e.target.style.background = 'white'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#e5e5e5'; e.target.style.background = '#fafafa'; }}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" style={{
                            display: 'block', marginBottom: '8px', fontSize: '13px',
                            fontWeight: '700', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px',
                                border: '2px solid #e5e5e5', background: '#fafafa',
                                color: COLORS.black, fontSize: '15px', outline: 'none', transition: 'all 0.2s'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = COLORS.orange; e.target.style.background = 'white'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#e5e5e5'; e.target.style.background = '#fafafa'; }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '12px', width: '100%', padding: '16px', borderRadius: '12px',
                            background: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDark})`,
                            color: 'white', border: 'none',
                            fontSize: '16px', fontWeight: '700', cursor: loading ? 'wait' : 'pointer',
                            transition: 'transform 0.1s, box-shadow 0.2s',
                            boxShadow: '0 8px 20px rgba(240, 100, 39, 0.3)'
                        }}
                        onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
                        onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                        onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 12px 28px rgba(240, 100, 39, 0.4)')}
                        onMouseLeave={(e) => !loading && (e.currentTarget.style.boxShadow = '0 8px 20px rgba(240, 100, 39, 0.3)')}
                    >
                        {loading ? 'Iniciando sesión...' : 'Ingresar al Portal'}
                    </button>
                    {/* Hidden input to trick browser autofill */}
                    <input type="text" style={{ display: 'none' }} autoComplete="username" />
                </form>

                <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                    <Link href="/" style={{
                        fontSize: '14px',
                        color: COLORS.orange,
                        textDecoration: 'none',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <ArrowLeft size={16} /> Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>Cargando...</div>}>
            <LoginForm />
        </Suspense>
    );
}
