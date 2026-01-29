'use client';

import Link from 'next/link';
import { Lock, Info, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div className="page flex items-center justify-center" style={{ minHeight: '100vh', padding: '40px 24px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
                <div className="text-center mb-6">
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><Lock size={48} color="#1f2937" /></div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                        Acceso Restringido
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Información sobre creación de cuentas
                    </p>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <Info size={24} color="#3b82f6" />
                        <div>
                            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                                Cuentas Institucionales
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                                Por seguridad, los estudiantes <strong>no pueden registrarse por su cuenta</strong>.
                                <br /><br />
                                Tu cuenta será creada automáticamente por la administración académica y recibirás tus credenciales en tu correo institucional <strong>@alumnos.uahurtado.cl</strong>.
                                <br /><br />
                                Al ingresar por primera vez, el sistema te pedirá crear una nueva contraseña segura.
                            </div>
                        </div>
                    </div>
                </div>

                <Link
                    href="/login"
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '14px 24px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'center',
                        textDecoration: 'none',
                        transition: 'background 0.2s'
                    }}
                >
                    Ir al Inicio de Sesión
                </Link>

                <div className="text-center mt-6" style={{ paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                    <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><ArrowLeft size={16} /> Volver al inicio</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
