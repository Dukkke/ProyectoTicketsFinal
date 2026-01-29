import { useState } from 'react';
import { User, CoordinatorStats } from '@/lib/api';
import { Ticket, GraduationCap, Presentation, FileText, Activity, Settings, User as UserIcon, LogOut } from 'lucide-react';

interface SidebarProps {
    user: User | null;
    activeTab: 'tickets' | 'estudiantes' | 'academicos' | 'justifications';
    setActiveTab: (tab: 'tickets' | 'estudiantes' | 'academicos' | 'justifications') => void;
    stats: CoordinatorStats | null;
    connectionStatus: 'online' | 'busy' | 'away' | 'offline';
    setConnectionStatus: (status: 'online' | 'busy' | 'away' | 'offline') => void;
    onLogout: () => void;
    onEditProfile: () => void;
    pendingJustifications?: number;
    pendingTickets?: number;
}

export function Sidebar({
    user,
    activeTab,
    setActiveTab,
    stats,
    connectionStatus,
    setConnectionStatus,
    onLogout,
    onEditProfile,
    pendingJustifications,
    pendingTickets = 0
}: SidebarProps) {
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    return (
        <aside style={{
            width: '280px',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.5)',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
            position: 'relative',
            zIndex: 10
        }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', paddingLeft: '8px' }}>
                    <div style={{
                        width: '40px', height: '40px', background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '20px', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)'
                    }}>
                        <GraduationCap size={24} />
                    </div>
                    <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', letterSpacing: '-0.5px' }}>
                        Te ayudamos FIN
                    </h1>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={() => setActiveTab('tickets')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px 20px', borderRadius: '16px',
                            background: activeTab === 'tickets' ? '#1e293b' : 'transparent',
                            color: activeTab === 'tickets' ? 'white' : '#64748b',
                            border: 'none', cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'left',
                            fontSize: '15px',
                            fontWeight: activeTab === 'tickets' ? '600' : '500',
                            boxShadow: activeTab === 'tickets' ? '0 8px 20px rgba(30, 41, 59, 0.25)' : 'none'
                        }}
                        title="Ver Tickets"
                    >
                        <Ticket size={20} /> Tickets
                        {pendingTickets > 0 && activeTab !== 'tickets' && (
                            <span style={{ marginLeft: 'auto', background: '#f59e0b', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px' }}>
                                {pendingTickets}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('estudiantes')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px 20px', borderRadius: '16px',
                            background: activeTab === 'estudiantes' ? '#1e293b' : 'transparent',
                            color: activeTab === 'estudiantes' ? 'white' : '#64748b',
                            border: 'none', cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'left',
                            fontSize: '15px',
                            fontWeight: activeTab === 'estudiantes' ? '600' : '500',
                            boxShadow: activeTab === 'estudiantes' ? '0 8px 20px rgba(30, 41, 59, 0.25)' : 'none'
                        }}
                    >
                        <UserIcon size={20} /> Estudiantes
                    </button>

                    <button
                        onClick={() => setActiveTab('academicos')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px 20px', borderRadius: '16px',
                            background: activeTab === 'academicos' ? '#1e293b' : 'transparent',
                            color: activeTab === 'academicos' ? 'white' : '#64748b',
                            border: 'none', cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'left',
                            fontSize: '15px',
                            fontWeight: activeTab === 'academicos' ? '600' : '500',
                            boxShadow: activeTab === 'academicos' ? '0 8px 20px rgba(30, 41, 59, 0.25)' : 'none'
                        }}
                    >
                        <Presentation size={20} /> Académicos y Académicas
                    </button>

                    {/* Justifications Tab - Hidden for Remote Coordinator */}
                    {!user?.name?.toLowerCase().includes('giannina') && (
                        <button
                            onClick={() => setActiveTab('justifications')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '16px',
                                padding: '16px 20px', borderRadius: '16px',
                                background: activeTab === 'justifications' ? '#1e293b' : 'transparent',
                                color: activeTab === 'justifications' ? 'white' : '#64748b',
                                border: 'none', cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                textAlign: 'left',
                                fontSize: '15px',
                                fontWeight: activeTab === 'justifications' ? '600' : '500',
                                boxShadow: activeTab === 'justifications' ? '0 8px 20px rgba(30, 41, 59, 0.25)' : 'none'
                            }}
                        >
                            <FileText size={20} /> Justificativos
                            {(pendingJustifications || 0) > 0 && activeTab !== 'justifications' && (
                                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px' }}>
                                    {pendingJustifications}
                                </span>
                            )}
                        </button>
                    )}

                    <div style={{ marginTop: '24px', paddingLeft: '20px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Estado de Ánimo
                    </div>
                    <div style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Energía</span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                {Math.max(0, 100 - ((pendingTickets || stats?.pending || 0) * 5))}% <Activity size={16} style={{ display: 'inline' }} />
                            </span>
                        </div>
                        {/* Battery Visual */}
                        <div style={{
                            width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px',
                            overflow: 'hidden', position: 'relative'
                        }}>
                            <div style={{
                                width: `${Math.max(0, 100 - ((pendingTickets || stats?.pending || 0) * 5))}%`,
                                height: '100%',
                                background: (100 - ((pendingTickets || stats?.pending || 0) * 5)) > 50 ? '#10b981' :
                                    (100 - ((pendingTickets || stats?.pending || 0) * 5)) > 20 ? '#f59e0b' : '#ef4444',
                                borderRadius: '6px',
                                transition: 'width 0.5s ease, background 0.5s ease'
                            }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            {(100 - ((stats?.pending || 0) * 5)) > 80 ? '¡Estás a tope!' :
                                (100 - ((stats?.pending || 0) * 5)) > 40 ? 'Cuidado con el estrés.' : 'Necesitas un descanso.'}
                        </div>
                    </div>
                </nav>
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Profile Photo with Connection Status */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: user?.profile_photo ? `url(${user?.profile_photo}) center/cover` : '#e0e7ff',
                            color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                            border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            {!user?.profile_photo && (user?.name?.charAt(0) || 'C')}
                        </div>
                        {/* Connection Status Indicator */}
                        <div style={{
                            position: 'absolute', bottom: '-2px', right: '-2px',
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: connectionStatus === 'online' ? '#22c55e' :
                                connectionStatus === 'busy' ? '#ef4444' :
                                    connectionStatus === 'away' ? '#f59e0b' : '#6b7280',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} title={connectionStatus === 'online' ? 'Conectado' : connectionStatus === 'busy' ? 'Ocupado' : connectionStatus === 'away' ? 'Ausente' : 'Desconectado'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                        <button onClick={onLogout} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: '500' }}>
                            Cerrar Sesión
                        </button>
                    </div>
                    {/* Settings Gear Icon */}
                    <button
                        onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                        style={{
                            background: showSettingsMenu ? '#f1f5f9' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '6px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                        }}
                        title="Configuración"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                {/* Settings Dropdown Menu */}
                {showSettingsMenu && (
                    <div style={{
                        position: 'absolute',
                        bottom: '70px',
                        left: '16px',
                        right: '16px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        border: '1px solid #e2e8f0',
                        padding: '8px',
                        zIndex: 100
                    }}>
                        <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
                            Configuración
                        </div>

                        {/* Edit Profile Option */}
                        <button
                            onClick={() => { onEditProfile(); setShowSettingsMenu(false); }}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px', borderRadius: '10px', border: 'none', background: 'transparent',
                                cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{ fontSize: '16px' }}><UserIcon size={16} /></span>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Editar Perfil</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Foto, contacto y más</div>
                            </div>
                        </button>

                        {/* Connection Status */}
                        <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', marginTop: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Estado de Conexión
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {[
                                    { status: 'online', label: 'Conectado', color: '#22c55e' },
                                    { status: 'busy', label: 'Ocupado', color: '#ef4444' },
                                    { status: 'away', label: 'Ausente', color: '#f59e0b' },
                                    { status: 'offline', label: 'Desconectado', color: '#6b7280' }
                                ].map(s => (
                                    <button
                                        key={s.status}
                                        onClick={() => setConnectionStatus(s.status as any)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 10px', borderRadius: '20px',
                                            border: connectionStatus === s.status ? `2px solid ${s.color}` : '1px solid #e2e8f0',
                                            background: connectionStatus === s.status ? `${s.color}15` : 'white',
                                            cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                                            color: connectionStatus === s.status ? s.color : '#64748b'
                                        }}
                                    >
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
