'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Ticket, getUsers, getAllTickets, createUser, updateUser, deleteUser, deleteTicket, resetUserPassword, getAdminAnalytics, getCoordinatorAnalytics, getAcademicAnalytics } from '@/lib/api';
import { parseTicketDescription } from '@/lib/chatUtils';
import styles from './page.module.css';

// ... (API function adminLogin remains unchanged)
async function adminLogin(email: string, password: string): Promise<User> {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            try {
                const error = await res.json();
                if (error.detail) throw new Error(error.detail);
            } catch { }

            if (res.status === 401) throw new Error('Credenciales incorrectas');
            if (res.status === 500) throw new Error('Error de conexión con el servidor');
            throw new Error('Error de autenticación. Intenta nuevamente.');
        }

        const user = await res.json();
        if (user.role !== 'ADMIN') throw new Error('Acceso denegado. Solo administradores autorizados.');
        return user;
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('fetch')) throw new Error('Error de conexión. Verifica tu internet.');
        if (err instanceof Error && !err.message.includes('JSON') && !err.message.includes('Unexpected')) throw err;
        throw new Error('Error de conexión con el servidor. Intenta más tarde.');
    }
}

export default function AdminPage() {
    const router = useRouter();

    // Auth states
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [admin, setAdmin] = useState<User | null>(null);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [coordAnalytics, setCoordAnalytics] = useState<any[]>([]);
    const [academicAnalytics, setAcademicAnalytics] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'usuarios' | 'tickets' | 'analytics'>('usuarios');
    const [userTab, setUserTab] = useState<'coordinadores' | 'academicos' | 'estudiantes'>('estudiantes');
    const [yearFilter, setYearFilter] = useState('all');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteTicketModal, setShowDeleteTicketModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    // Form states
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'ACADEMICO', year: '', rut: '' });
    const [editForm, setEditForm] = useState({ name: '', email: '', role: '', year: '', rut: '', personal_email: '', phone: '', emergency_phone: '', modality: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const storedAdmin = localStorage.getItem('admin');
        if (storedAdmin) {
            const adminData = JSON.parse(storedAdmin);
            if (adminData.role === 'ADMIN') {
                setAdmin(adminData);
                setIsAuthenticated(true);
            }
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, ticketsData] = await Promise.all([
                getUsers(),
                getAllTickets(),
            ]);
            setUsers(usersData);
            setTickets(ticketsData);

            try {
                const [analyticsData, coordData] = await Promise.all([
                    getAdminAnalytics(),
                    getCoordinatorAnalytics()
                ]);
                setAnalytics(analyticsData);
                setCoordAnalytics(coordData);

                try {
                    const acadData = await getAcademicAnalytics();
                    setAcademicAnalytics(acadData);
                } catch (e) {
                    setAcademicAnalytics([]);
                }
            } catch (ignore) {
                setAnalytics(null);
                setCoordAnalytics([]);
            }
            setError('');
        } catch (err) {
            setError('Error al cargar datos. Verifica la conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);

        try {
            const adminUser = await adminLogin(loginEmail, loginPassword);
            localStorage.setItem('admin', JSON.stringify(adminUser));
            setAdmin(adminUser);
            setIsAuthenticated(true);
        } catch (err) {
            setLoginError(err instanceof Error ? err.message : 'Error de autenticación');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin');
        setIsAuthenticated(false);
        setAdmin(null);
        router.push('/');
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createUser({
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                year: newUser.year || undefined,
                requestingRole: 'ADMIN'
            });
            setSuccess('Usuario creado exitosamente');
            setShowCreateModal(false);
            setNewUser({ name: '', email: '', password: '', role: 'ACADEMICO', year: '', rut: '' });
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear usuario');
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setError('');
        try {
            await updateUser(selectedUser.id, {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role,
                year: editForm.year || undefined,
                rut: editForm.rut,
                personal_email: editForm.personal_email,
                phone: editForm.phone,
                emergency_phone: editForm.emergency_phone,
                modality: editForm.modality
            });
            setSuccess('Usuario actualizado');
            setShowEditModal(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setDeleteLoading(true);
        try {
            await deleteUser(selectedUser.id);
            setSuccess('Usuario eliminado');
            setShowDeleteModal(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteTicket = async () => {
        if (!selectedTicket) return;
        setDeleteLoading(true);
        try {
            await deleteTicket(selectedTicket.id, true); // Admin always hard deletes
            setSuccess('Ticket eliminado permanentemente');
            setShowDeleteTicketModal(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !newPassword) return;
        setError('');
        try {
            await resetUserPassword(selectedUser.id, newPassword);
            setSuccess(`Contraseña de ${selectedUser.name} actualizada`);
            setShowPasswordModal(false);
            setNewPassword('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
        }
    };

    // Helper functions
    const getRoleBadge = (role: string) => {
        const r = role.toLowerCase();
        if (r === 'estudiante') return { bg: '#e0f2fe', color: '#0369a1', label: 'Estudiante' };
        if (r === 'academico') return { bg: '#dcfce7', color: '#166534', label: 'Académico' };
        if (r === 'coordinador') return { bg: '#f3e8ff', color: '#7c3aed', label: 'Coordinador' };
        if (r === 'admin') return { bg: '#fef3c7', color: '#b45309', label: 'Admin' };
        return { bg: '#f3f4f6', color: '#4b5563', label: role };
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string, color: string }> = {
            pendiente: { bg: '#fef3c7', color: '#b45309' },
            aceptado: { bg: '#dbeafe', color: '#1d4ed8' },
            completado: { bg: '#dcfce7', color: '#166534' },
            solucionado: { bg: '#dcfce7', color: '#166534' },
            respondido: { bg: '#e0f2fe', color: '#0369a1' },
            derivado: { bg: '#f3e8ff', color: '#7c3aed' },
            rechazado: { bg: '#fee2e2', color: '#b91c1c' },
        };
        return badges[status.toLowerCase()] || badges.pendiente;
    };

    const formatResponseTime = (created: string, responded?: string) => {
        if (!responded) return '-';
        const start = new Date(created);
        const end = new Date(responded);
        const diff = end.getTime() - start.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    if (!isAuthenticated) {
        return (
            <div className={styles.loginContainer}>
                <div className={styles.loginCard}>
                    <div className={styles.loginHeader}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔐</div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>
                            Panel de Administración
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                            Acceso restringido a administradores autorizados
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        {loginError && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '20px',
                                color: '#fca5a5',
                                fontSize: '14px'
                            }}>
                                ⚠️ {loginError}
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Email de Administrador</label>
                            <input
                                type="email"
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                                placeholder="admin@tickets.uah.cl"
                                required
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Contraseña</label>
                            <input
                                type="password"
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className={styles.input}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loginLoading}
                            className={styles.loginButton}
                        >
                            {loginLoading ? 'Verificando...' : 'Acceder al Panel'}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <a href="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
                            ← Volver al inicio
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <span style={{ fontSize: '24px' }}>🔐</span>
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>Admin Panel</span>
                    <span className={styles.adminBadge}>ADMIN</span>
                </div>
                <div className={styles.headerRight}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>{admin?.name}</span>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    {/* Stats */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statValue} style={{ color: '#3b82f6' }}>{users.length}</div>
                            <div className={styles.statLabel}>Usuarios</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue} style={{ color: '#22c55e' }}>{users.filter(u => u.role.toLowerCase() === 'academico').length}</div>
                            <div className={styles.statLabel}>Académicos</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue} style={{ color: '#06b6d4' }}>{users.filter(u => u.role.toLowerCase() === 'estudiante').length}</div>
                            <div className={styles.statLabel}>Estudiantes</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue} style={{ color: '#f59e0b' }}>{tickets.length}</div>
                            <div className={styles.statLabel}>Tickets</div>
                        </div>
                    </div>

                    {success && (
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#86efac' }}>
                            ✅ {success}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className={styles.tabsContainer}>
                        <button
                            onClick={() => setActiveTab('usuarios')}
                            className={`${styles.tabButton} ${activeTab === 'usuarios' ? styles.activeTab : ''}`}
                        >
                            👥 Usuarios ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`${styles.tabButton} ${activeTab === 'tickets' ? styles.activeTab : ''}`}
                        >
                            📋 Tickets ({tickets.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            📊 Métricas
                            <span style={{ background: '#f59e0b', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>NEW</span>
                        </button>
                    </div>

                    {/* Users Tab */}
                    {activeTab === 'usuarios' && (
                        <>
                            <div className={styles.subTabsContainer}>
                                <button
                                    onClick={() => setUserTab('coordinadores')}
                                    className={`${styles.subTabButton} ${userTab === 'coordinadores' ? styles.activeSubTab : ''}`}
                                >
                                    👔 Coordinadores
                                </button>
                                <button
                                    onClick={() => setUserTab('academicos')}
                                    className={`${styles.subTabButton} ${userTab === 'academicos' ? styles.activeSubTab : ''}`}
                                >
                                    📚 Académicos
                                </button>
                                <button
                                    onClick={() => setUserTab('estudiantes')}
                                    className={`${styles.subTabButton} ${userTab === 'estudiantes' ? styles.activeSubTab : ''}`}
                                >
                                    🎓 Estudiantes
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                                    Mostrando {userTab === 'coordinadores' ? 'Coordinadores' : userTab === 'academicos' ? 'Académicos' : 'Estudiantes'}
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                                >
                                    ➕ Nuevo Usuario
                                </button>
                            </div>

                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.th}>Nombre</th>
                                            <th className={styles.th}>Email</th>
                                            {userTab === 'estudiantes' && (
                                                <>
                                                    <th className={styles.th}>RUT</th>
                                                    <th className={styles.th} style={{ textAlign: 'center' }}>
                                                        <select
                                                            value={yearFilter}
                                                            onChange={(e) => setYearFilter(e.target.value)}
                                                            style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                                                        >
                                                            <option value="all">AÑO (TODOS)</option>
                                                            <option value="2022">2022</option>
                                                            <option value="2023">2023</option>
                                                            <option value="2024">2024</option>
                                                            <option value="2025">2025</option>
                                                            <option value="2026">2026</option>
                                                        </select>
                                                    </th>
                                                </>
                                            )}
                                            <th className={styles.th} style={{ textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.filter(u => {
                                            const r = u.role.toLowerCase();
                                            if (r === 'admin') return false;
                                            if (userTab === 'coordinadores') return r === 'coordinador';
                                            if (userTab === 'academicos') return r === 'academico';
                                            if (userTab === 'estudiantes') {
                                                if (r !== 'estudiante') return false;
                                                if (yearFilter !== 'all') return (u.admission_year?.toString() || u.year) === yearFilter;
                                                return true;
                                            }
                                            return false;
                                        }).map((u) => (
                                            <tr key={u.id}>
                                                <td className={styles.td} style={{ fontWeight: '500' }}>
                                                    {u.name}
                                                    {u.role.toLowerCase() === 'coordinador' && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#4f46e5', padding: '2px 6px', borderRadius: '4px' }}>COORD</span>}
                                                </td>
                                                <td className={styles.td} style={{ color: '#94a3b8' }}>{u.email}</td>
                                                {userTab === 'estudiantes' && (
                                                    <>
                                                        <td className={styles.td} style={{ color: '#94a3b8' }}>{u.rut || '-'}</td>
                                                        <td className={styles.td} style={{ textAlign: 'center' }}>
                                                            <span style={{ background: '#1e3a8a', color: '#60a5fa', padding: '2px 12px', borderRadius: '12px', fontSize: '12px' }}>
                                                                {u.admission_year || u.year || '?'}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}
                                                <td className={styles.td} style={{ textAlign: 'right' }}>
                                                    <button onClick={() => { setSelectedUser(u); setEditForm({ name: u.name, email: u.email, role: u.role, year: u.year || '', rut: u.rut || '', personal_email: u.personal_email || '', phone: u.phone || '', emergency_phone: u.emergency_phone || '', modality: u.modality || '' }); setShowEditModal(true); }} className={styles.actionButton} style={{ color: '#fbbf24' }}>✏️</button>
                                                    <button onClick={() => { setSelectedUser(u); setShowPasswordModal(true); }} className={styles.actionButton} style={{ color: '#a855f7' }}>🔑</button>
                                                    <button onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }} className={styles.actionButton} style={{ color: '#ef4444' }}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Tickets Tab */}
                    {activeTab === 'tickets' && (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Código</th>
                                        <th className={styles.th}>Título/Estudiante</th>
                                        <th className={styles.th}>Atendido por</th>
                                        <th className={styles.th}>Derivado a</th>
                                        <th className={styles.th}>Tiempo</th>
                                        <th className={styles.th}>Estado</th>
                                        <th className={styles.th} style={{ textAlign: 'right' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map(t => {
                                        const badge = getStatusBadge(t.status);
                                        return (
                                            <tr key={t.id} onClick={() => { setSelectedTicket(t); setShowDetailModal(true); }} style={{ cursor: 'pointer' }}>
                                                <td className={styles.td} style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>
                                                    {t.ticket_code}<br />
                                                    <span style={{ fontSize: '10px', opacity: 0.7 }}>{new Date(t.created_at).toLocaleDateString()}</span>
                                                </td>
                                                <td className={styles.td}>
                                                    <div style={{ fontWeight: '500' }}>{t.title}</div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{t.student_name} ({t.student_year || '-'})</div>
                                                </td>
                                                <td className={styles.td} style={{ color: '#e2e8f0' }}>
                                                    {t.coordinator_name ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span>👔</span> {t.coordinator_name}</span> : <span style={{ color: '#64748b' }}>Pendiente</span>}
                                                </td>
                                                <td className={styles.td} style={{ color: '#e2e8f0' }}>
                                                    {t.escalated_to_academic && t.academic_name ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a78bfa' }}><span>📚</span> {t.academic_name}</span> : <span style={{ color: '#64748b' }}>-</span>}
                                                </td>
                                                <td className={styles.td} style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>
                                                    {formatResponseTime(t.created_at, t.responded_at)}
                                                </td>
                                                <td className={styles.td}>
                                                    <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' }}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className={styles.td} style={{ textAlign: 'right' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); setError(''); setShowDeleteTicketModal(true); }} className={styles.actionButton} style={{ color: '#ef4444' }}>🗑️</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Analytics Tab (Simplified for brevity, assuming styles applied similarly) */}
                    {activeTab === 'analytics' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className={styles.analyticsGrid}>
                                <div className={styles.analyticsCard}>
                                    {/* ... Content ... */}
                                    <h3 className={styles.modalHeader}>Valoración del Servicio</h3>
                                    <div style={{ fontSize: '56px', fontWeight: '800', color: '#f59e0b' }}>{analytics?.average_satisfaction || '0.0'}</div>
                                    {/* ... */}
                                </div>
                                <div className={styles.analyticsCard}>
                                    <h3 className={styles.modalHeader}>Tiempos de Respuesta</h3>
                                    <div style={{ fontSize: '56px', fontWeight: '800', color: '#3b82f6' }}>{analytics?.average_response_hours || '0.0'} h</div>
                                    {/* ... */}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 className={styles.modalHeader}>➕ Crear Usuario</h2>
                        <form onSubmit={handleCreateUser}>
                            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#fca5a5', fontSize: '14px' }}>⚠️ {error}</div>}
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Nombre</label>
                                <input type="text" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} required className={styles.input} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email</label>
                                <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} required className={styles.input} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Contraseña</label>
                                <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} required className={styles.input} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Rol</label>
                                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className={styles.input}>
                                    <option value="ACADEMICO">Académico</option>
                                    <option value="ESTUDIANTE">Estudiante</option>
                                    <option value="coordinador">Coordinador</option>
                                </select>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.cancelButton}>Cancelar</button>
                                <button type="submit" className={styles.confirmButton}>Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 className={styles.modalHeader}>✏️ Editar Usuario</h2>
                        <form onSubmit={handleEditUser}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Nombre</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required className={styles.input} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email</label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} required className={styles.input} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Rol</label>
                                <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className={styles.input}>
                                    <option value="ACADEMICO">Académico</option>
                                    <option value="ESTUDIANTE">Estudiante</option>
                                    <option value="coordinador">Coordinador</option>
                                </select>
                            </div>
                            <div className={styles.inputGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className={styles.label}>RUT</label>
                                    <input type="text" value={editForm.rut} onChange={e => setEditForm(p => ({ ...p, rut: e.target.value }))} className={styles.input} />
                                </div>
                                <div>
                                    <label className={styles.label}>Año Ingreso</label>
                                    <input type="text" value={editForm.year} onChange={e => setEditForm(p => ({ ...p, year: e.target.value }))} className={styles.input} />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email Personal</label>
                                <input type="email" value={editForm.personal_email} onChange={e => setEditForm(p => ({ ...p, personal_email: e.target.value }))} className={styles.input} />
                            </div>
                            <div className={styles.inputGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className={styles.label}>Teléfono</label>
                                    <input type="text" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className={styles.input} />
                                </div>
                                <div>
                                    <label className={styles.label}>Tel. Emergencia</label>
                                    <input type="text" value={editForm.emergency_phone} onChange={e => setEditForm(p => ({ ...p, emergency_phone: e.target.value }))} className={styles.input} />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Modalidad</label>
                                <select value={editForm.modality} onChange={e => setEditForm(p => ({ ...p, modality: e.target.value }))} className={styles.input}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Diurna">Diurna</option>
                                    <option value="Vespertina">Vespertina / Remota</option>
                                </select>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowEditModal(false)} className={styles.cancelButton}>Cancelar</button>
                                <button type="submit" className={styles.confirmButton} style={{ background: '#3b82f6' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE USER CONFIRMATION MODAL */}
            {showDeleteModal && selectedUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '400px', borderRadius: '30px' }}>
                        <h2 className={styles.modalHeader}>¿Eliminar Usuario?</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
                            Estás a punto de eliminar a <strong>{selectedUser.name}</strong>. Esta acción no se puede deshacer.
                        </p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowDeleteModal(false)} className={styles.cancelButton} style={{ background: '#334155', border: 'none', color: '#94a3b8' }}>Cancelar</button>
                            <button onClick={handleDeleteUser} disabled={deleteLoading} className={styles.confirmButton} style={{ background: '#ef4444', opacity: deleteLoading ? 0.7 : 1 }}>{deleteLoading ? 'Eliminando...' : 'Eliminar'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE TICKET CONFIRMATION MODAL */}
            {showDeleteTicketModal && selectedTicket && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '400px', borderRadius: '30px' }}>
                        <h2 className={styles.modalHeader}>¿Eliminar Ticket?</h2>
                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px' }}>
                                ⚠️ {error}
                            </div>
                        )}
                        <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
                            Estás a punto de eliminar el ticket <strong>{selectedTicket.ticket_code}</strong>. Esta acción es irreversible.
                        </p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowDeleteTicketModal(false)} className={styles.cancelButton} style={{ background: '#334155', border: 'none', color: '#94a3b8' }}>Cancelar</button>
                            <button onClick={handleDeleteTicket} disabled={deleteLoading} className={styles.confirmButton} style={{ background: '#ef4444', opacity: deleteLoading ? 0.7 : 1 }}>{deleteLoading ? 'Eliminando...' : 'Eliminar'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TICKET DETAIL MODAL */}
            {showDetailModal && selectedTicket && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentLarge}>

                        {/* Header */}
                        <div className={styles.header}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                                    {selectedTicket.title}
                                </h2>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>{selectedTicket.ticket_code}</span>
                                    <span style={{ background: '#1e293b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#f8fafc', border: '1px solid #334155' }}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Student Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                                    {selectedTicket.student_name?.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '16px' }}>{selectedTicket.student_name}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                                        RUT: {selectedTicket.student_rut || 'No registrado'} • Año: {selectedTicket.student_year || '?'}°
                                    </div>
                                </div>
                            </div>

                            {/* Main Description / Chat History */}
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Historial del Ticket</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {parseTicketDescription(selectedTicket.description).map((msg, idx) => (
                                        <div key={idx} className={styles.chatMessage} style={{ flexDirection: msg.author === 'Coordinador' ? 'row-reverse' : 'row' }}>
                                            <div className={`${styles.chatBubble} ${msg.author === 'Coordinador' ? styles.chatBubbleCoordinator : styles.chatBubbleStudent}`}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', opacity: 0.8 }}>
                                                    {msg.author === 'Coordinador' ? `Coordinación (${selectedTicket.coordinator_name || '?'})` : selectedTicket.student_name}
                                                    {msg.date && <span style={{ fontWeight: 'normal', marginLeft: '6px' }}>• {msg.date}</span>}
                                                </div>
                                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Current Coordinator Response */}
                                    {selectedTicket.coordinator_response && (
                                        <div className={styles.chatMessage} style={{ flexDirection: 'row-reverse' }}>
                                            <div className={`${styles.chatBubble} ${styles.chatBubbleCoordinator}`} style={{ border: '2px solid #60a5fa' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', opacity: 0.8 }}>
                                                    {selectedTicket.coordinator_name || 'Coordinación'} (Actual)
                                                </div>
                                                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.coordinator_response}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Derivation Info Section */}
                            {selectedTicket.escalated_to_academic && (
                                <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(167, 139, 250, 0.05))', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '18px' }}>📚</span>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase' }}>Derivado a Académico</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Profesor</div>
                                            <div style={{ color: '#f8fafc', fontSize: '15px', fontWeight: '600' }}>{selectedTicket.academic_name || 'No asignado'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Derivado por</div>
                                            <div style={{ color: '#f8fafc', fontSize: '15px' }}>{selectedTicket.coordinator_name || '-'}</div>
                                        </div>
                                    </div>
                                    {selectedTicket.escalation_note && (
                                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Nota de Derivación</div>
                                            <div style={{ color: '#e2e8f0', fontSize: '14px', fontStyle: 'italic' }}>"{selectedTicket.escalation_note}"</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Metadata Grid */}
                            <div className={styles.metadataGrid}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Atendido por</div>
                                    <div style={{ color: '#f8fafc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {selectedTicket.coordinator_name ? (
                                            <><span>👔</span> {selectedTicket.coordinator_name}</>
                                        ) : <span style={{ color: '#64748b' }}>Pendiente</span>}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Fecha Creación</div>
                                    <div style={{ color: '#f8fafc', fontSize: '14px' }}>{new Date(selectedTicket.created_at).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Fecha Respuesta</div>
                                    <div style={{ color: '#f8fafc', fontSize: '14px' }}>{selectedTicket.responded_at ? new Date(selectedTicket.responded_at).toLocaleString() : '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Fecha Solución</div>
                                    <div style={{ color: '#f8fafc', fontSize: '14px' }}>{selectedTicket.resolved_at ? new Date(selectedTicket.resolved_at).toLocaleString() : '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Valoración</div>
                                    <div style={{ color: '#f59e0b', fontSize: '14px' }}>
                                        {selectedTicket.satisfaction_rating ? '★'.repeat(selectedTicket.satisfaction_rating) : '-'}
                                    </div>
                                </div>
                                {selectedTicket.satisfaction_comment && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Comentario del Estudiante</div>
                                        <div style={{ color: '#e2e8f0', fontSize: '14px', fontStyle: 'italic' }}>"{selectedTicket.satisfaction_comment}"</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={styles.modalFooter}>
                            <button onClick={() => setShowDetailModal(false)} className={styles.actionButton} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid #334155', background: 'transparent', color: '#f8fafc', marginBottom: 0 }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordModal && selectedUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
                        <h2 className={styles.modalHeader}>🔑 Cambiar Contraseña</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>Usuario: <strong style={{ color: '#f8fafc' }}>{selectedUser.name}</strong></p>
                        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#fca5a5', fontSize: '14px' }}>⚠️ {error}</div>}
                        <div style={{ marginBottom: '20px' }}>
                            <label className={styles.label}>Nueva Contraseña</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => { setShowPasswordModal(false); setError(''); }} className={styles.cancelButton}>Cancelar</button>
                            <button onClick={handleResetPassword} className={styles.confirmButton} style={{ background: '#f59e0b', color: '#0f172a' }}>Cambiar</button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
