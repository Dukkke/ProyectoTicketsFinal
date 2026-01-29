'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Ticket, Academic,
    getUsers, getAllTickets, getAcademics, getCoordinatorStats,
    respondTicket, escalateTicket, deleteTicket, completeTicket, createUser, updateUser, deleteUser, resetUserPassword,
    getCourseStudents, createCourse,
    CoordinatorStats,
    archiveTicket,
    // Justifications
    getPendingJustifications, approveJustification, rejectJustification,
    updateJustificationProfessors
} from '@/lib/api';
import { parseTicketDescription } from '@/lib/chatUtils';
import {
    Moon, Sun, CheckCircle, AlertTriangle, User as UserIcon, Users, Eye, Edit, Trash2,
    BookOpen, RotateCcw, MessageSquare, ArrowRight, Lightbulb, Mail, CreditCard, Phone,
    GraduationCap, Presentation, LogOut
} from 'lucide-react';
import CalendarWidget from './CalendarWidget';
import { Sidebar } from '@/components/features/Coordinator/Sidebar';
import { ProfileModal } from '@/components/features/Coordinator/ProfileModal';
import { StatsCards } from '@/components/features/Coordinator/StatsCards';
import NotificationBell from '@/components/shared/NotificationBell';

export default function CoordinadorPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [academics, setAcademics] = useState<Academic[]>([]);
    const [stats, setStats] = useState<CoordinatorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tickets' | 'estudiantes' | 'academicos' | 'justifications'>('tickets');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'responded' | 'solved'>('pending');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Ticket actions
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [responseText, setResponseText] = useState('');
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [escalateAcademicId, setEscalateAcademicId] = useState('');
    const [escalateNote, setEscalateNote] = useState('');

    // Auto-resize for response
    const responseRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (showRespondModal && responseRef.current) {
            responseRef.current.style.height = 'auto';
            responseRef.current.style.height = `${Math.min(responseRef.current.scrollHeight, 300)}px`;
        }
    }, [responseText, showRespondModal]);

    // User management
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteTicketModal, setShowDeleteTicketModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState({ nombres: '', apellido_paterno: '', apellido_materno: '', email: '', password: '', role: 'ESTUDIANTE', year: '', rut: '', modality: 'Presencial' });
    const [editForm, setEditForm] = useState({ name: '', email: '', role: '', year: '', rut: '' });
    const [newPassword, setNewPassword] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [yearFilter, setYearFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [remoteStudents, setRemoteStudents] = useState<Record<number, boolean>>({});
    const [showMyTicketsOnly, setShowMyTicketsOnly] = useState(false);

    // Settings Menu State
    // Settings Menu State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'online' | 'busy' | 'away' | 'offline'>('online');

    const handleProfileUpdate = (updatedUser: User) => {
        setUser(updatedUser);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            localStorage.setItem('user', JSON.stringify({ ...parsed, ...updatedUser }));
        }
    };

    const isGiannina = user?.name?.toLowerCase().includes('giannina');

    const toggleRemote = (id: number) => {
        setRemoteStudents(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Check session
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                console.log('No session found, redirecting to login');
                router.push('/login?role=coordinador');
                return;
            }
            const userData = JSON.parse(storedUser);
            const role = userData.role.toLowerCase();
            if (role !== 'coordinador' && role !== 'admin') {
                console.log('Invalid role for coordinator page:', role);
                router.push('/login?role=coordinador');
                return;
            }
            setUser(userData);

            // Restore previously saved view state
            const savedTab = localStorage.getItem('coordinator_activeTab');
            if (savedTab && (savedTab === 'tickets' || savedTab === 'estudiantes' || savedTab === 'academicos' || savedTab === 'justifications')) {
                setActiveTab(savedTab as any);
            }

            const savedFilter = localStorage.getItem('coordinator_statusFilter');
            if (savedFilter) {
                setStatusFilter(savedFilter as 'all' | 'pending' | 'responded' | 'solved');
            }

        } catch (error) {
            console.error('Session check error:', error);
            router.push('/login?role=coordinador');
        }
    }, [router]);

    // Persist UI state
    useEffect(() => {
        localStorage.setItem('coordinator_activeTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('coordinator_statusFilter', statusFilter);
    }, [statusFilter]);

    // Data fetching logic
    const fetchData = async () => {
        try {
            const storedUser = localStorage.getItem('user');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const usersData = await getUsers(currentUser?.email);
            setUsers(usersData.filter(u => u.role.toLowerCase() !== 'admin'));
        } catch (err) { console.error('Error loading users:', err); }

        try {
            const storedUser = localStorage.getItem('user');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const ticketsData = await getAllTickets(currentUser?.email);
            setTickets(ticketsData);
        } catch (err) { console.error('Error loading tickets:', err); }

        try {
            const academicsData = await getAcademics();
            setAcademics(academicsData);
        } catch (err) { console.error('Error loading academics:', err); }

        try {
            const statsData = await getCoordinatorStats();
            setStats(statsData);
        } catch (err) { console.error('Error loading stats:', err); }
    };

    // Initial load with spinner
    const loadData = useCallback(async () => {
        setLoading(true);
        await fetchData();
        setLoading(false);
    }, []);

    // Refresh without spinner
    const refreshData = useCallback(async () => {
        await fetchData();
    }, []);

    // Justification Logic
    const [justifications, setJustifications] = useState<any[]>([]);
    const [loadingJustifications, setLoadingJustifications] = useState(false);
    const [selectedJustification, setSelectedJustification] = useState<any>(null);
    const [showJustificationModal, setShowJustificationModal] = useState(false);
    const [isEditingProfessors, setIsEditingProfessors] = useState(false);
    const [selectedProfIds, setSelectedProfIds] = useState<number[]>([]);


    // Helper to get professor names from IDs
    const getProfessorNames = useCallback((ids: number[]) => {
        if (!ids || ids.length === 0) return 'Sin asignar';
        return ids.map(id => {
            const academic = academics.find(a => a.id === id);
            return academic ? academic.name : `ID: ${id}`;
        }).join(', ');
    }, [academics]);
    // Helper to parse JSON array of strings or return single string as array
    const parseFileList = (jsonStr: any): string[] => {
        if (!jsonStr) return [];
        if (Array.isArray(jsonStr)) return jsonStr;
        try {
            const parsed = JSON.parse(jsonStr);
            return Array.isArray(parsed) ? parsed : [jsonStr];
        } catch (e) {
            return [jsonStr];
        }
    };


    const fetchJustifications = async () => {
        if (!user || !user.email) return;
        try {
            const data = await getPendingJustifications(user.email);
            setJustifications(data.items || []);
        } catch (err) { console.error('Error loading justifications:', err); }
    };

    const loadJustifications = useCallback(async () => {
        setLoadingJustifications(true);
        await fetchJustifications();
        setLoadingJustifications(false);
    }, [user]);

    const refreshJustifications = useCallback(async () => {
        await fetchJustifications();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'justifications') {
            refreshJustifications();
        }
    }, [activeTab, refreshJustifications]);

    useEffect(() => {
        if (user) {
            loadData();
            loadJustifications();
            const interval = setInterval(() => {
                refreshData();
                refreshJustifications();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [user, loadData, loadJustifications, refreshData, refreshJustifications]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    // Ticket actions
    const handleRespond = async () => {
        if (!selectedTicket || !responseText.trim() || !user) return;
        try {
            await respondTicket(selectedTicket.id, responseText, user.id);
            setSuccess('Respuesta enviada correctamente');
            setShowRespondModal(false);
            setResponseText('');
            setSelectedTicket(null);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al responder');
        }
    };

    const handleEscalate = async () => {
        if (!selectedTicket || !escalateAcademicId || !user) return;
        try {
            await escalateTicket(selectedTicket.id, parseInt(escalateAcademicId), escalateNote, user.id);
            setSuccess('Ticket derivado al profesor');
            setShowEscalateModal(false);
            setEscalateAcademicId('');
            setEscalateNote('');
            setSelectedTicket(null);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al derivar');
        }
    };

    const handleDeleteTicket = async (ticketId: number) => {
        // Confirmation is handled by the modal
        try {
            await deleteTicket(ticketId);
            setSuccess('Ticket eliminado');
            // Close both modals and clear selection to update UI immediately
            setShowDeleteTicketModal(false);
            setShowDetailModal(false);
            setSelectedTicket(null);

            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al eliminar';
            // If it says "not found", consider it already deleted (success)
            if (msg.toLowerCase().includes('no encontrado')) {
                setSuccess('Ticket eliminado (ya no existe)');
                setShowDeleteTicketModal(false);
                setShowDetailModal(false);
                setSelectedTicket(null);
                loadData();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(msg);
            }
        }
    };




    // User CRUD
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            // Determine modality (Giannina -> Vespertina, Others -> Diurna/Specified)
            let modality = 'Diurna';
            if (isGiannina) {
                modality = 'Vespertina';
            } else if (newUser.role === 'ACADEMICO' && newUser.modality) {
                // Map frontend selection to backend values if needed, or stick to 'Presencial'/'Remota'
                // But backend expects specific values for students (Diurna/Vespertina).
                // For Academics, let's use the selection.
                // Assuming backend supports arbitrary strings or we map "Presencial" -> "Diurna", "Remota" -> "Vespertina"?
                // Let's use the explicit selection for now.
                modality = newUser.modality;
            }

            // Combine names into full name for display
            const fullName = `${newUser.nombres.trim()} ${newUser.apellido_paterno.trim()} ${newUser.apellido_materno.trim()}`.trim();

            await createUser({
                name: fullName,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                rut: newUser.rut,
                paternal_surname: newUser.apellido_paterno,
                maternal_surname: newUser.apellido_materno,
                modality: modality,
                admission_year: parseInt(newUser.year) || undefined,
                requestingRole: 'coordinador',
                requestingEmail: user?.email
            });

            setSuccess('Usuario creado exitosamente');
            setShowCreateModal(false);
            setNewUser({ nombres: '', apellido_paterno: '', apellido_materno: '', email: '', password: '', role: 'ESTUDIANTE', year: '', rut: '', modality: 'Presencial' });
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            await updateUser(selectedUser.id, {
                ...editForm,
                admission_year: parseInt(editForm.year) || undefined
            });
            setSuccess('Usuario actualizado');
            setShowEditModal(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
    };

    const handleDeleteUser = (userId: number) => {
        const userToDelete = users.find(u => u.id === userId);
        if (userToDelete) {
            setSelectedUser(userToDelete);
            setShowDeleteModal(true);
        }
    };

    const confirmDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.id, 'coordinador');
            setSuccess('Usuario eliminado exitosamente');
            setShowDeleteModal(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !newPassword) return;
        try {
            await resetUserPassword(selectedUser.id, newPassword);
            setSuccess('Contraseña actualizada');
            setShowPasswordModal(false);
            setNewPassword('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
    };

    // Helpers
    const students = users.filter(u => u.role.toLowerCase() === 'estudiante');
    const academicUsers = users.filter(u => u.role.toLowerCase() === 'academico');

    const filteredStudents = users
        .filter(u => u.role.toLowerCase() === 'estudiante')
        .filter(s => {
            if (yearFilter === 'all') return true;
            if (yearFilter === 'remote') return remoteStudents[s.id];
            // Compare admission_year (as string) or year (as string)
            const sYear = (s.admission_year || s.year || '').toString();
            return sYear === yearFilter;
        })
        .filter(s => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return s.name.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query) ||
                (s.rut || '').toLowerCase().includes(query);
        });

    const filteredAcademics = academicUsers.filter(a => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return a.name.toLowerCase().includes(query) ||
            a.email.toLowerCase().includes(query);
    });

    const filteredTickets = tickets.filter(t => {
        // Filter by date
        if (selectedDate) {
            if (!t.proposed_date) return false;
            const tDate = new Date(t.proposed_date);
            const sDate = new Date(selectedDate);
            if (tDate.getDate() !== sDate.getDate() ||
                tDate.getMonth() !== sDate.getMonth() ||
                tDate.getFullYear() !== sDate.getFullYear()) {
                return false;
            }
        }

        // Filter by "Mis Tickets" (Assigned to me)
        if (showMyTicketsOnly) {
            // Include tickets where coordinator_id matches OR if I am the one who responded (stored in coordinator_id usually)
            // Backend updates coordinator_id on response.
            if (t.coordinator_id !== user?.id) return false;
        }

        return true;
    });

    const getWeekRange = (dateStr: string | null) => {
        const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { start: monday, end: sunday };
    };

    const { start: weekStart, end: weekEnd } = getWeekRange(selectedDate);

    const weeklyTickets = tickets.filter(t => {
        if (!t.proposed_date) return false;
        const tDate = new Date(t.proposed_date);
        return tDate >= weekStart && tDate <= weekEnd;
    });

    const getStatusStyle = (status: string) => {
        const styles: Record<string, { bg: string; color: string; label: string }> = {
            pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
            respondido: { bg: '#dbeafe', color: '#1e40af', label: 'Respondido' },
            solucionado: { bg: '#dcfce7', color: '#166534', label: 'Solucionado' },
            derivado: { bg: '#f3e8ff', color: '#7c3aed', label: 'Derivado' },
            aceptado: { bg: '#e0f2fe', color: '#0369a1', label: 'Aceptado' },
            rechazado: { bg: '#fee2e2', color: '#b91c1c', label: 'Rechazado' },
            completado: { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
        };
        return styles[status] || styles.pendiente;
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p style={{ color: '#64748b' }}>Cargando portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #eef2ff 50%, #f5f3ff 100%)',
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            {/* SIDEBAR */}
            <Sidebar
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                stats={stats}
                connectionStatus={connectionStatus}
                setConnectionStatus={setConnectionStatus}
                onLogout={handleLogout}
                onEditProfile={() => setShowProfileModal(true)}
                pendingJustifications={isGiannina ? 0 : justifications.length}
                pendingTickets={tickets.filter(t => t.status === 'pendiente').length}
            />

            {/* MAIN CONTENT */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* HEADER + STATS COMPACTOS */}
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                                    Hola, {user?.name?.split(' ')[0]}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Aquí tienes lo que está pasando hoy.</p>
                                    {/* Modality Indicator Badge */}
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        background: isGiannina ? 'linear-gradient(135deg, #4c1d95, #7c3aed)' : 'linear-gradient(135deg, #0369a1, #0ea5e9)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: isGiannina ? '0 2px 8px rgba(124, 58, 237, 0.3)' : '0 2px 8px rgba(14, 165, 233, 0.3)'
                                    }}>
                                        {isGiannina ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Moon size={20} /> Modalidad Remota</div> : <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Sun size={20} /> Modalidad Presencial</div>}
                                    </span>
                                </div>
                            </div>
                            {/* Stats Cards Compactos al lado del nombre */}
                            <StatsCards
                                weeklyTickets={weeklyTickets}
                                justifications={justifications}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                mode={activeTab === 'justifications' && !isGiannina ? 'justifications' : 'tickets'}
                            />
                        </div>

                        {/* Right side: App logos, notifications, and profile */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Current Time Widget */}
                            <div style={{
                                background: 'white', padding: '6px 12px', borderRadius: '12px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '6px',
                                color: '#1e293b', fontWeight: '700', fontSize: '14px', border: '1px solid #e2e8f0', minWidth: '100px', justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '16px' }}>🕒</span>
                                {currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                            {/* Success/Error messages */}
                            {success && (
                                <div style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                                    <CheckCircle size={16} /> {success}
                                </div>
                            )}
                            {error && (
                                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                                    <AlertTriangle size={16} /> {error}
                                </div>
                            )}

                            {user && <NotificationBell userId={user.id} />}

                            {/* App Icons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                {[
                                    { name: 'U-Campus', url: 'https://ucampus.uahurtado.cl/', img: '/icons/UcampusLogo.png' },
                                    { name: 'Outlook', url: 'https://outlook.office.com', img: '/icons/OutlookLogo.jfif' },
                                    { name: 'Teams', url: 'https://teams.microsoft.com', img: '/icons/TeamsLogo.jfif' },
                                    { name: 'Gmail', url: 'https://mail.google.com', img: '/icons/GmailLogo.png' },
                                    { name: 'LinkedIn', url: 'https://www.linkedin.com', img: '/icons/LogoLinkediN.png' }
                                ].map((app, idx) => (
                                    <a key={idx} href={app.url} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'block', width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', transition: 'transform 0.2s' }}
                                        title={`Ir a ${app.name}`}>
                                        <img src={app.img} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </a>
                                ))}
                            </div>

                            {/* User Profile */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{user?.name}</div>
                                </div>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: user?.profile_photo ? `url(${user.profile_photo}) center/cover` : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 'bold', fontSize: '14px',
                                    border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                }}>
                                    {!user?.profile_photo && user?.name?.charAt(0)}
                                </div>
                            </div>
                        </div>
                    </header>
                    {/* MAIN LAYOUT: Content + Calendar */}
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                        {/* LEFT: Main Content Area */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                        {activeTab === 'tickets' && 'Tickets Recientes'}
                                        {activeTab === 'estudiantes' && 'Gestión de Estudiantes'}
                                        {activeTab === 'academicos' && 'Gestión Académica'}
                                    </h3>

                                    {/* Toggle for Mis Tickets */}
                                    {activeTab === 'tickets' && (
                                        <button
                                            onClick={() => setShowMyTicketsOnly(!showMyTicketsOnly)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                border: showMyTicketsOnly ? 'none' : '1px solid #cbd5e1',
                                                background: showMyTicketsOnly ? '#1e293b' : 'white',
                                                color: showMyTicketsOnly ? 'white' : '#64748b',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {showMyTicketsOnly ? <><UserIcon size={16} /> Mis Tickets</> : <><Users size={16} /> Todos los Tickets</>}
                                        </button>
                                    )}
                                </div>

                                {/* Search Bar - visible for all tabs now? No, just keep as is for students/academics */}
                                {(activeTab === 'estudiantes' || activeTab === 'academicos') && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                placeholder={activeTab === 'estudiantes' ? "Buscar por nombre, email o RUT..." : "Buscar por nombre o email..."}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{
                                                    padding: '10px 14px 10px 38px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    background: 'white',
                                                    fontSize: '13px',
                                                    width: '280px',
                                                    outline: 'none',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                            />
                                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Year Filter + New Button for Estudiantes */}
                            {activeTab === 'estudiantes' && (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {['all', '2026', '2025', '2024', '2023', '2022'].map(y => (
                                        <button
                                            key={y}
                                            onClick={() => setYearFilter(y)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '16px',
                                                border: 'none',
                                                background: yearFilter === y ? '#1e293b' : 'white',
                                                color: yearFilter === y ? 'white' : '#64748b',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                transition: 'all 0.2s',
                                                boxShadow: yearFilter === y ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {y === 'all' ? 'Todos' : `Año de Ingreso: ${y}`}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => { setNewUser({ nombres: '', apellido_paterno: '', apellido_materno: '', email: '', password: '', role: 'ESTUDIANTE', year: '', rut: '', modality: 'Presencial' }); setShowCreateModal(true); }}
                                        style={{
                                            background: isGiannina ? '#8b5cf6' : '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '20px',
                                            border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '12px',
                                            boxShadow: isGiannina ? '0 3px 8px rgba(139, 92, 246, 0.25)' : '0 3px 8px rgba(59, 130, 246, 0.25)',
                                            display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto'
                                        }}
                                    >
                                        {isGiannina ? '🌙' : '☀️'} + Nuevo Estudiante
                                    </button>
                                </div>
                            )}

                            {/* New Button for Academicos */}
                            {activeTab === 'academicos' && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                    <button
                                        onClick={() => { setNewUser({ nombres: '', apellido_paterno: '', apellido_materno: '', email: '', password: '', role: 'ACADEMICO', year: '', rut: '', modality: 'Presencial' }); setShowCreateModal(true); }}
                                        style={{
                                            background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: '20px',
                                            border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '12px',
                                            boxShadow: '0 3px 8px rgba(30, 41, 59, 0.15)'
                                        }}
                                    >
                                        + Nuevo Académico
                                    </button>
                                </div>
                            )}

                            {/* USERS TABLES */}
                            {(activeTab === 'estudiantes' || activeTab === 'academicos') && (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '0 16px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Nombre</th>
                                                <th style={{ textAlign: 'left', padding: '0 16px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Email</th>
                                                {activeTab === 'estudiantes' && <th style={{ textAlign: 'left', padding: '0 16px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>RUT</th>}
                                                {activeTab === 'estudiantes' && <th style={{ textAlign: 'center', padding: '0 16px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Año de Ingreso</th>}
                                                <th style={{ textAlign: 'right', padding: '0 16px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(activeTab === 'estudiantes' ? filteredStudents : filteredAcademics).map(u => (
                                                <tr key={u.id} style={{ transition: 'all 0.2s' }}>
                                                    <td style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px 0 0 12px', color: '#1e293b', fontWeight: '600' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            {u.name}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', background: '#f8fafc', color: '#64748b' }}>{u.email}</td>
                                                    {activeTab === 'estudiantes' && <td style={{ padding: '16px', background: '#f8fafc', color: '#64748b' }}>{u.rut || '—'}</td>}
                                                    {activeTab === 'estudiantes' && (
                                                        <td style={{ padding: '16px', background: '#f8fafc', textAlign: 'center' }}>
                                                            <span style={{ background: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#3b82f6', border: '1px solid #e2e8f0' }}>
                                                                {u.admission_year || u.year || '-'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '16px', background: '#f8fafc', borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            {isGiannina && activeTab === 'estudiantes' && (
                                                                <button
                                                                    onClick={() => toggleRemote(u.id)}
                                                                    title={remoteStudents[u.id] ? "Quitar de Remoto" : "Asignar a Remoto"}
                                                                    style={{
                                                                        width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                                                                        background: remoteStudents[u.id] ? '#dcfce7' : 'white',
                                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        color: remoteStudents[u.id] ? '#166534' : '#64748b',
                                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                                                    }}
                                                                >
                                                                    🏠
                                                                </button>
                                                            )}
                                                            {activeTab === 'estudiantes' && (
                                                                <button onClick={() => { setSelectedUser(u); setShowDetailModal(true); }} title="Ver detalle" style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><Eye size={16} /></button>
                                                            )}
                                                            <button onClick={() => { setSelectedUser(u); setEditForm({ name: u.name, email: u.email, role: u.role, year: u.admission_year?.toString() || u.year || '', rut: u.rut || '' }); setShowEditModal(true); }} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><Edit size={16} /></button>
                                                            <button onClick={() => { setSelectedUser(u); setShowPasswordModal(true); }} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>🔑</button>
                                                            <button onClick={() => handleDeleteUser(u.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}


                            {/* JUSTIFICATIONS LIST */}
                            {activeTab === 'justifications' && (
                                <div className="fade-in">
                                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                                            Justificativos Pendientes
                                            {justifications.length > 0 && (
                                                <span style={{ marginLeft: '10px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                                    {justifications.length} Nuevos
                                                </span>
                                            )}
                                        </h3>
                                    </div>

                                    {loadingJustifications ? (
                                        <div style={{ textAlign: 'center', padding: '40px' }}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div>
                                    ) : justifications.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</div>
                                            <h3 style={{ color: '#1e293b', fontWeight: '700' }}>¡Todo al día!</h3>
                                            <p style={{ color: '#64748b' }}>No hay justificativos pendientes de revisión.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                            {justifications.map(j => (
                                                <div
                                                    key={j.id}
                                                    onClick={() => { setSelectedJustification(j); setSelectedProfIds(j.professor_ids || []); setIsEditingProfessors(false); setShowJustificationModal(true); }}
                                                    style={{
                                                        background: 'white', borderRadius: '20px', padding: '24px',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                                                        border: '1px solid #f1f5f9',
                                                        display: 'flex', flexDirection: 'column', gap: '16px',
                                                        cursor: 'pointer', transition: 'transform 0.2s',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                                                                {j.student?.name || 'Estudiante desconocido'}
                                                            </div>
                                                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                                {j.student?.rut}
                                                            </div>
                                                            <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '4px', fontWeight: '500' }}>
                                                                Ingreso: {j.student?.admission_year || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <span style={{
                                                            background: '#fef3c7', color: '#92400e',
                                                            padding: '4px 10px', borderRadius: '12px',
                                                            fontSize: '11px', fontWeight: '700', textTransform: 'uppercase'
                                                        }}>
                                                            {j.status}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <span>📅</span>
                                                            <span style={{ fontWeight: '500' }}>
                                                                {new Date(j.absence_start_date).toLocaleDateString()} - {new Date(j.absence_end_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <span><BookOpen size={20} /></span>
                                                            <span>{j.affected_courses}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <span>👨‍🏫</span>
                                                            <span>{getProfessorNames(j.professor_ids)}</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.stopPropagation(); {
                                                                    const files = parseFileList(j.document_filename);
                                                                    if (files.length > 1) {
                                                                        // Open modal instead of opening one file
                                                                        setSelectedJustification(j);
                                                                        setSelectedProfIds(j.professor_ids || []);
                                                                        setIsEditingProfessors(false);
                                                                        setShowJustificationModal(true);
                                                                    } else {
                                                                        window.open(`http://localhost:8000/api/justifications/document/${files[0] || j.document_filename}`, '_blank');
                                                                    }
                                                                }
                                                            }}
                                                            style={{
                                                                width: '100%', padding: '10px', borderRadius: '12px',
                                                                border: '1px solid #e2e8f0', background: 'white',
                                                                color: '#475569', fontWeight: '600', fontSize: '13px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {parseFileList(j.document_filename).length > 1 ? '📄 Ver Documentos' : '📄 Ver PDF'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Justification Details Modal */}
                                    {showJustificationModal && selectedJustification && (
                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowJustificationModal(false)}>
                                            <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                                                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Detalles del Justificativo</h2>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Estudiante</div>
                                                        <div style={{ fontWeight: '600' }}>{selectedJustification.student?.name}</div>
                                                        <div style={{ fontSize: '13px', color: '#94a3b8' }}>{selectedJustification.student?.rut}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Año de Ingreso</div>
                                                        <div style={{ fontWeight: '600' }}>{selectedJustification.student?.admission_year || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Ramos Afectados</div>
                                                        <div style={{ fontWeight: '600' }}>{selectedJustification.affected_courses}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span>Profesores</span>
                                                            {!isEditingProfessors && (
                                                                <button
                                                                    onClick={() => setIsEditingProfessors(true)}
                                                                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                                                                >
                                                                    ✏️ Editar
                                                                </button>
                                                            )}
                                                        </div>
                                                        {isEditingProfessors ? (
                                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {academics.map(acad => (
                                                                        <label key={acad.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedProfIds.includes(acad.id)}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) setSelectedProfIds([...selectedProfIds, acad.id]);
                                                                                    else setSelectedProfIds(selectedProfIds.filter(id => id !== acad.id));
                                                                                }}
                                                                            />
                                                                            {acad.name}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await updateJustificationProfessors(selectedJustification.id, selectedProfIds);
                                                                                setSuccess('Profesores actualizados');
                                                                                setIsEditingProfessors(false);
                                                                                // Update locally
                                                                                selectedJustification.professor_ids = selectedProfIds;
                                                                                loadJustifications();
                                                                            } catch (e) { setError('Error al actualizar'); }
                                                                        }}
                                                                        style={{ flex: 1, padding: '6px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                                                                    >
                                                                        Guardar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setIsEditingProfessors(false);
                                                                            setSelectedProfIds(selectedJustification.professor_ids || []);
                                                                        }}
                                                                        style={{ flex: 1, padding: '6px', background: '#cbd5e1', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontWeight: '600' }}>{getProfessorNames(selectedJustification.professor_ids)}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Motivo</div>
                                                        <div style={{ fontWeight: '600' }}>{selectedJustification.absence_reason}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Fechas</div>
                                                        <div style={{ fontWeight: '600' }}>{new Date(selectedJustification.absence_start_date).toLocaleDateString()} - {new Date(selectedJustification.absence_end_date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '24px' }}>
                                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Documentos Adjuntos</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {(() => {
                                                            const filenames = parseFileList(selectedJustification.document_filename);
                                                            const paths = parseFileList(selectedJustification.document_path);
                                                            return filenames.map((fname, idx) => (
                                                                <div key={idx} style={{
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                    padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                                                        <span style={{ fontSize: '20px' }}>📄</span>
                                                                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {fname}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <button
                                                                            onClick={() => window.open(`http://localhost:8000/api/justifications/document/${paths[idx] || fname}`, '_blank')}
                                                                            style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                                        >
                                                                            Abrir
                                                                        </button>
                                                                        <a
                                                                            href={`http://localhost:8000/api/justifications/document/${paths[idx] || fname}`}
                                                                            download={fname}
                                                                            style={{ padding: '6px 12px', background: '#e2e8f0', color: '#475569', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}
                                                                        >
                                                                            Descargar
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                                    <button
                                                        onClick={async () => {
                                                            if (!user) return;
                                                            const reason = window.prompt("Ingrese motivo de rechazo:");
                                                            if (!reason) return;
                                                            try {
                                                                await rejectJustification(selectedJustification.id, user.id, reason);
                                                                setSuccess('Justificativo rechazado');
                                                                setShowJustificationModal(false);
                                                                loadJustifications();
                                                            } catch (e) { setError('Error al rechazar'); }
                                                        }}
                                                        style={{ flex: 1, padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                                                    >
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!user) return;
                                                            if (!window.confirm("¿Aprobar justificativo?")) return;
                                                            try {
                                                                await approveJustification(selectedJustification.id, user.id);
                                                                setSuccess('Justificativo aprobado');
                                                                setShowJustificationModal(false);
                                                                loadJustifications();
                                                            } catch (e) { setError('Error al aprobar'); }
                                                        }}
                                                        style={{ flex: 1, padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '12px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                                                    >
                                                        Aprobar
                                                    </button>
                                                </div>
                                                <div style={{ marginTop: '12px' }}>
                                                    <button onClick={() => setShowJustificationModal(false)} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#94a3b8', borderRadius: '12px', border: 'none', fontWeight: '500', cursor: 'pointer' }}>
                                                        Cerrar sin cambios
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}


                            {/* TICKETS LIST */}
                            {
                                activeTab === 'tickets' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: statusFilter === 'all' ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr', gap: '24px', alignItems: 'start' }}>
                                        {[
                                            {
                                                id: 'pending',
                                                title: 'Pendientes',
                                                icon: '⏳',
                                                bg: '#fffbeb',
                                                borderColor: '#fcd34d',
                                                tickets: filteredTickets.filter(t => t.status === 'pendiente')
                                            },
                                            {
                                                id: 'responded',
                                                title: 'En Gestión',
                                                icon: '🔥',
                                                bg: '#eff6ff',
                                                borderColor: '#93c5fd',
                                                tickets: filteredTickets.filter(t => ['derivado', 'respondido', 'aceptado'].includes(t.status))
                                            },
                                            {
                                                id: 'solved',
                                                title: 'Finalizados',
                                                icon: '✅',
                                                bg: '#f0fdf4',
                                                borderColor: '#86efac',
                                                tickets: filteredTickets.filter(t => ['solucionado', 'completado', 'rechazado'].includes(t.status))
                                            }
                                        ]
                                            .filter(col => statusFilter === 'all' || col.id === statusFilter).map((column, idx) => (
                                                <div key={idx} style={{
                                                    background: column.bg,
                                                    borderRadius: '24px',
                                                    padding: '20px',
                                                    border: `1px solid ${column.borderColor}`,
                                                    minHeight: '200px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span>{column.icon}</span> {column.title}
                                                        </h3>
                                                        <span style={{
                                                            background: 'white', padding: '4px 12px', borderRadius: '12px',
                                                            fontSize: '12px', fontWeight: '700', color: '#64748b',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                        }}>
                                                            {column.tickets.length}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {column.tickets.length === 0 ? (
                                                            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                                                                No hay tickets
                                                            </div>
                                                        ) : (
                                                            column.tickets.map(ticket => {
                                                                const statusStyle = getStatusStyle(ticket.status);
                                                                return (
                                                                    <div key={ticket.id} style={{
                                                                        background: 'white', borderRadius: '20px', padding: '20px',
                                                                        boxShadow: ticket.coordinator_id === user?.id ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : '0 4px 6px rgba(0,0,0,0.02)',
                                                                        cursor: 'pointer',
                                                                        position: 'relative',
                                                                        transition: 'transform 0.2s',
                                                                        border: ticket.coordinator_id === user?.id ? '1px solid #3b82f6' : '1px solid rgba(0,0,0,0.05)'
                                                                    }}
                                                                        onClick={() => { setSelectedTicket(ticket); setShowDetailModal(true); }}
                                                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                                    >
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                            <span style={{
                                                                                background: statusStyle.bg, color: statusStyle.color,
                                                                                padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase'
                                                                            }}>
                                                                                {statusStyle.label}
                                                                            </span>
                                                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(ticket.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'numeric' })}</span>
                                                                        </div>

                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', lineHeight: '1.4', margin: 0, flex: 1 }}>
                                                                                {ticket.title}
                                                                            </h4>
                                                                            {/* Reopen Badge */}
                                                                            {ticket.reopen_count && ticket.reopen_count > 0 && ['pendiente', 'derivado'].includes(ticket.status) ? (
                                                                                <span style={{
                                                                                    fontSize: '11px', fontWeight: '800', color: '#b45309',
                                                                                    background: '#fef3c7', padding: '4px 8px', borderRadius: '6px',
                                                                                    border: '1px solid #f59e0b', whiteSpace: 'nowrap', marginLeft: '8px',
                                                                                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
                                                                                }}>
                                                                                    <RotateCcw size={14} /> Reabierto
                                                                                </span>
                                                                            ) : null}
                                                                        </div>

                                                                        {/* Student Info */}
                                                                        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                            <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                <UserIcon size={14} /> {ticket.student_name || 'Estudiante'}
                                                                            </span>
                                                                            {ticket.student_modality && (
                                                                                <span style={{
                                                                                    fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                                                                                    background: ticket.student_modality.toLowerCase().includes('vespertina') ? '#1e1b4b' : '#f59e0b', // Dark blue for Vespertino, Orange/Sun for Diurno
                                                                                    color: 'white', fontWeight: '600'
                                                                                }}>
                                                                                    {ticket.student_modality === 'Vespertina' ? 'Modalidad Remota' : ticket.student_modality}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                            {ticket.description}
                                                                        </p>

                                                                        {/* Last interaction/Coordinator Response preview */}
                                                                        {ticket.coordinator_response && (
                                                                            <div style={{ fontSize: '11px', background: '#f8fafc', padding: '8px', borderRadius: '8px', marginBottom: '12px', color: '#475569' }}>
                                                                                <span style={{ fontWeight: '600', color: ticket.escalated_to_academic ? '#7c3aed' : '#3b82f6' }}>
                                                                                    {ticket.escalated_to_academic
                                                                                        ? `📚 ${ticket.academic_name || 'Profesor'}:`
                                                                                        : `👤 ${ticket.coordinator_name || 'Coordinador/a'}:`}
                                                                                </span> {ticket.coordinator_response}
                                                                            </div>
                                                                        )}

                                                                        {/* Student Satisfaction Rating Display */}
                                                                        {ticket.satisfaction_rating && (
                                                                            <div style={{
                                                                                background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)',
                                                                                padding: '10px 12px',
                                                                                borderRadius: '10px',
                                                                                marginBottom: '12px',
                                                                                border: '1px solid #fcd34d'
                                                                            }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: ticket.satisfaction_comment ? '6px' : '0' }}>
                                                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#92400e' }}>Valoración:</span>
                                                                                    <span style={{ fontSize: '14px' }}>
                                                                                        {'⭐'.repeat(ticket.satisfaction_rating)}
                                                                                        {'☆'.repeat(5 - ticket.satisfaction_rating)}
                                                                                    </span>
                                                                                </div>
                                                                                {ticket.satisfaction_comment && (
                                                                                    <p style={{ fontSize: '11px', color: '#78350f', margin: 0, fontStyle: 'italic' }}>
                                                                                        "{ticket.satisfaction_comment}"
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Contextual Actions */}
                                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                                                            {ticket.status === 'pendiente' && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); setShowRespondModal(true); }}
                                                                                        style={{ padding: '6px 12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600' }}
                                                                                        title="Responder"
                                                                                    >
                                                                                        <span><MessageSquare size={16} /></span> Responder
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); setShowEscalateModal(true); }}
                                                                                        style={{ padding: '6px 12px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600' }}
                                                                                        title="Derivar"
                                                                                    >
                                                                                        <span><ArrowRight size={16} /></span> Derivar
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); setShowDeleteTicketModal(true); }}
                                                                                        style={{ padding: '6px 12px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600' }}
                                                                                        title="Eliminar"
                                                                                    >
                                                                                        <span><Trash2 size={16} /></span> Borrar
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            {(ticket.status === 'derivado' || ticket.status === 'respondido') && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (confirm('¿Marcar como solucionado?')) {
                                                                                            completeTicket(ticket.id).then(() => {
                                                                                                setSuccess('Ticket solucionado');
                                                                                                loadData();
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                    style={{ padding: '6px 12px', borderRadius: '8px', background: '#dcfce7', color: '#166534', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                                                >
                                                                                    <span>✔</span> Resolver
                                                                                </button>
                                                                            )}
                                                                            {(ticket.status === 'solucionado' || ticket.status === 'completado') && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); setShowDeleteTicketModal(true); }}
                                                                                    style={{ padding: '6px 12px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                                                                >
                                                                                    Borrar
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                )
                            }

                            {/* RAMOS MANAGEMENT VIEW */}

                        </div >

                        {/* RIGHT: Calendar & Tips */}
                        < div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <CalendarWidget tickets={tickets} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
                            <div style={{ background: '#1e293b', borderRadius: '20px', padding: '16px', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>💡</span>
                                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', margin: 0 }}>Tips de Gestión</h3>
                                </div>
                                <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#cbd5e1', margin: 0 }}>
                                    Recuerda verificar la carga académica de los profesores antes de derivar tickets.
                                </p>
                            </div>
                        </div >
                    </div >
                </div >
            </main >

            {/* MODALS - Styled nicely */}
            {/* RESPOND MODAL */}
            {
                showRespondModal && selectedTicket && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '550px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={24} /> Responder Ticket</h2>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
                                {parseTicketDescription(selectedTicket.description).map((msg, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '12px', flexDirection: msg.author === 'Coordinador' ? 'row-reverse' : 'row' }}>
                                        <div style={{
                                            maxWidth: '80%', padding: '16px 20px',
                                            background: msg.author === 'Coordinador' ? '#1e293b' : '#f1f5f9',
                                            color: msg.author === 'Coordinador' ? 'white' : '#1e293b',
                                            borderRadius: '20px',
                                            borderBottomLeftRadius: msg.author === 'Coordinador' ? '20px' : '4px',
                                            borderBottomRightRadius: msg.author === 'Coordinador' ? '4px' : '20px'
                                        }}>
                                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <textarea
                                ref={responseRef}
                                value={responseText}
                                onChange={e => setResponseText(e.target.value)}
                                placeholder="Escribe tu respuesta..."
                                style={{
                                    width: '100%', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px',
                                    fontSize: '15px', minHeight: '120px', maxHeight: '300px', marginBottom: '24px', resize: 'none', outline: 'none',
                                    overflowY: 'auto'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowRespondModal(false)} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleRespond} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#1e293b', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Enviar Respuesta</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ESCALATE MODAL */}
            {
                showEscalateModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '450px', padding: '32px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Derivar a Profesor</h2>
                            <select
                                value={escalateAcademicId}
                                onChange={e => setEscalateAcademicId(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '14px', background: '#f8fafc' }}
                            >
                                <option value="">Selecciona un profesor</option>
                                {academics.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <textarea
                                value={escalateNote}
                                onChange={e => setEscalateNote(e.target.value)}
                                placeholder="Nota para el profesor..."
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '100px', marginBottom: '24px', fontSize: '14px', background: '#f8fafc' }}
                            />
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowEscalateModal(false)} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleEscalate} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Derivar</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* STUDENT DETAIL MODAL */}
            {
                showDetailModal && selectedUser && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '28px',
                            width: '90%',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Header */}
                            <div style={{
                                background: selectedUser.modality === 'Vespertina'
                                    ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
                                    : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                padding: '20px 28px',
                                color: 'white',
                                flexShrink: 0
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowDetailModal(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    ← Volver
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: '700'
                                    }}>
                                        {selectedUser.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                                            {selectedUser.name}
                                        </h2>
                                        <p style={{ fontSize: '13px', opacity: 0.9, margin: '4px 0 0 0' }}>
                                            {selectedUser.modality === 'Vespertina' ? '🌙 Modalidad Remota' : '☀️ Diurno'} • Ingreso {selectedUser.admission_year || selectedUser.year || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {/* Apellidos */}
                                    {(selectedUser.paternal_surname || selectedUser.maternal_surname) && (
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>👥 APELLIDOS</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>
                                                {selectedUser.paternal_surname} {selectedUser.maternal_surname}
                                            </div>
                                        </div>
                                    )}

                                    {/* Email institucional */}
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>📧 EMAIL INSTITUCIONAL</div>
                                        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{selectedUser.email}</div>
                                    </div>

                                    {/* Email personal */}
                                    {selectedUser.personal_email && (
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>📬 EMAIL PERSONAL</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{selectedUser.personal_email}</div>
                                        </div>
                                    )}

                                    {/* RUT y Año */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>🆔 RUT</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{selectedUser.rut || '—'}</div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>📅 AÑO INGRESO</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{selectedUser.admission_year || selectedUser.year || '—'}</div>
                                        </div>
                                    </div>

                                    {/* Teléfono de emergencia */}
                                    {selectedUser.emergency_phone && (
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>📱 TELÉFONO EMERGENCIA</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{selectedUser.emergency_phone}</div>
                                        </div>
                                    )}

                                    {/* Modalidad */}
                                    <div style={{
                                        background: selectedUser.modality === 'Vespertina' ? '#f5f3ff' : '#eff6ff',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: selectedUser.modality === 'Vespertina' ? '1px solid #ddd6fe' : '1px solid #bfdbfe'
                                    }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>🎓 MODALIDAD</div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: selectedUser.modality === 'Vespertina' ? '#7c3aed' : '#2563eb'
                                        }}>
                                            {selectedUser.modality === 'Vespertina' ? '🌙 Modalidad Remota' : '☀️ Presencial Diurna'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CREATE/EDIT USER MODALS */}
            {
                showCreateModal && activeTab === 'estudiantes' && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '28px',
                            width: '90%',
                            maxWidth: '520px',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Header with modality indicator and back button */}
                            <div style={{
                                background: isGiannina
                                    ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
                                    : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                padding: '20px 28px',
                                color: 'white',
                                flexShrink: 0
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    ← Volver
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                    {isGiannina ? <Moon size={24} /> : <Sun size={24} />}
                                    <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                                        Nuevo Estudiante {isGiannina ? 'Vespertino' : 'Diurno'}
                                    </h2>
                                </div>
                                <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
                                    {isGiannina
                                        ? 'Modalidad Remota'
                                        : 'Modalidad Presencial Diurna'}
                                </p>
                            </div>

                            {/* Scrollable Form */}
                            <form onSubmit={handleCreateUser} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                                {/* Nombres field */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                                        👤 Nombres
                                    </label>
                                    <input
                                        placeholder="Ej: Juan Pablo"
                                        value={newUser.nombres}
                                        onChange={e => setNewUser({ ...newUser, nombres: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            borderRadius: '12px',
                                            border: '2px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {/* Apellidos row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                                            Apellido Paterno
                                        </label>
                                        <input
                                            placeholder="Ej: González"
                                            value={newUser.apellido_paterno}
                                            onChange={e => setNewUser({ ...newUser, apellido_paterno: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                border: '2px solid #e2e8f0',
                                                background: '#f8fafc',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                                            Apellido Materno
                                        </label>
                                        <input
                                            placeholder="Ej: López"
                                            value={newUser.apellido_materno}
                                            onChange={e => setNewUser({ ...newUser, apellido_materno: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                border: '2px solid #e2e8f0',
                                                background: '#f8fafc',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                                        📧 Email Institucional
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="estudiante@uahurtado.cl"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            borderRadius: '12px',
                                            border: '2px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                                        🔐 Contraseña Temporal
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                        minLength={6}
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            borderRadius: '12px',
                                            border: '2px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                                        El estudiante deberá cambiarla en su primer inicio de sesión
                                    </p>
                                </div>

                                {/* Year and RUT row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                                            📅 Año de Ingreso
                                        </label>
                                        <select
                                            value={newUser.year}
                                            onChange={e => setNewUser({ ...newUser, year: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                border: '2px solid #e2e8f0',
                                                background: '#f8fafc',
                                                fontSize: '14px',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="2026">2026</option>
                                            <option value="2025">2025</option>
                                            <option value="2024">2024</option>
                                            <option value="2023">2023</option>
                                            <option value="2022">2022</option>
                                            <option value="2021">2021</option>
                                            <option value="2020">2020</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                                            🆔 RUT
                                        </label>
                                        <input
                                            placeholder="12.345.678-9"
                                            value={newUser.rut}
                                            onChange={e => setNewUser({ ...newUser, rut: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                border: '2px solid #e2e8f0',
                                                background: '#f8fafc',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    style={{
                                        padding: '14px 28px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: isGiannina
                                            ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
                                            : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        boxShadow: isGiannina
                                            ? '0 4px 14px rgba(139, 92, 246, 0.4)'
                                            : '0 4px 14px rgba(59, 130, 246, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        marginTop: '8px'
                                    }}
                                >
                                    ✨ Crear Estudiante
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* EDIT USER MODAL (separate for academics and general edit) */}
            {
                (showEditModal || (showCreateModal && activeTab !== 'estudiantes')) && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '450px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <button
                                type="button"
                                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                                style={{
                                    background: '#f1f5f9',
                                    border: 'none',
                                    color: '#64748b',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '16px'
                                }}
                            >
                                ← Volver
                            </button>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>
                                {showCreateModal ? '👨‍🏫 Nuevo Académico' : '✏️ Editar Usuario'}
                            </h2>
                            <form onSubmit={showCreateModal ? handleCreateUser : handleEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {showCreateModal ? (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <input
                                                placeholder="Nombres"
                                                value={newUser.nombres}
                                                onChange={e => setNewUser({ ...newUser, nombres: e.target.value })}
                                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                            />
                                            <input
                                                placeholder="Ap. Paterno"
                                                value={newUser.apellido_paterno}
                                                onChange={e => setNewUser({ ...newUser, apellido_paterno: e.target.value })}
                                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                            />
                                            <input
                                                placeholder="Ap. Materno"
                                                value={newUser.apellido_materno}
                                                onChange={e => setNewUser({ ...newUser, apellido_materno: e.target.value })}
                                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                            />
                                        </div>
                                        <input
                                            placeholder="Email"
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        />
                                        {newUser.role === 'ACADEMICO' && (
                                            <select
                                                value={newUser.modality}
                                                onChange={e => setNewUser({ ...newUser, modality: e.target.value })}
                                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', width: '100%' }}
                                            >
                                                <option value="Presencial">Presencial</option>
                                                <option value="Remota">Modalidad Remota</option>
                                            </select>
                                        )}
                                        <input
                                            type="password"
                                            placeholder="Contraseña"
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <input
                                            placeholder="Nombre completo"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        />
                                        <input
                                            placeholder="Email"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        />
                                        {selectedUser?.role.toLowerCase() === 'estudiante' && (
                                            <>
                                                <input
                                                    placeholder="Año de Ingreso"
                                                    type="number"
                                                    value={editForm.year}
                                                    onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                                                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                />
                                                <input
                                                    placeholder="RUT"
                                                    value={editForm.rut}
                                                    onChange={e => setEditForm({ ...editForm, rut: e.target.value })}
                                                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                />
                                            </>
                                        )}
                                    </>
                                )}

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                    <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#1e293b', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                        {showCreateModal ? 'Crear' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }



            {/* PASSWORD RESET MODAL */}
            {
                showPasswordModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '400px', padding: '32px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Cambiar Contraseña</h2>
                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '24px' }}
                            />
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowPasswordModal(false)} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleResetPassword} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Actualizar</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* DELETE USER CONFIRMATION MODAL */}
            {
                showDeleteModal && selectedUser && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '400px', padding: '32px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>¿Eliminar Usuario?</h2>
                            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                                Estás a punto de eliminar a <strong>{selectedUser.name}</strong>. Esta acción no se puede deshacer.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowDeleteModal(false)} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={confirmDeleteUser} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* DELETE TICKET CONFIRMATION MODAL */}
            {
                showDeleteTicketModal && selectedTicket && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626', marginBottom: '16px' }}>🗑️ ¿Eliminar Ticket Permanentemente?</h2>
                            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
                                Estás a punto de <strong style={{ color: '#dc2626' }}>eliminar permanentemente</strong> el ticket <strong style={{ color: '#1e293b' }}>{selectedTicket.ticket_code}</strong>.
                                <br /><br />
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '12px', fontSize: '14px', fontWeight: '500' }}>
                                    ⚠️ Esta acción NO se puede deshacer. El ticket quedará registrado en el historial de auditoría.
                                </span>
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {error && <span style={{ color: '#dc2626', fontSize: '13px', marginRight: 'auto', fontWeight: '500' }}>⚠️ {error}</span>}
                                <button onClick={() => setShowDeleteTicketModal(false)} style={{ padding: '12px 24px', borderRadius: '16px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={() => handleDeleteTicket(selectedTicket.id)} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#dc2626', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px rgba(220, 38, 38, 0.2)' }}>Eliminar Permanentemente</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* TICKET DETAIL MODAL */}
            {
                showDetailModal && selectedTicket && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <div style={{ background: 'white', borderRadius: '24px', width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>

                            {/* Header */}
                            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                                        {selectedTicket.title}
                                    </h2>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedTicket.ticket_code}</span>
                                        <span style={{
                                            background: selectedTicket.status === 'solucionado' || selectedTicket.status === 'completado' ? '#dcfce7' : '#f8fafc',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            color: selectedTicket.status === 'solucionado' || selectedTicket.status === 'completado' ? '#166534' : '#475569',
                                            border: selectedTicket.status === 'solucionado' || selectedTicket.status === 'completado' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                                        }}>
                                            {selectedTicket.status}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setShowDetailModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                            </div>

                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* Student Info */}
                                {/* Student Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)' }}>
                                        {selectedTicket.student_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ color: '#1e293b', fontWeight: '700', fontSize: '16px' }}>{selectedTicket.student_name}</div>
                                        <div style={{ color: '#64748b', fontSize: '13px' }}>
                                            RUT: {selectedTicket.student_rut || 'No registrado'} • Año: {selectedTicket.student_year || '?'}° • Ingreso: {selectedTicket.student_admission_year || '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Description / Chat History */}
                                <div>
                                    <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Historial del Ticket</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {parseTicketDescription(selectedTicket.description).map((msg, idx) => (

                                            <div key={idx} style={{ display: 'flex', flexDirection: msg.author === 'Coordinador' ? 'row' : 'row-reverse', gap: '12px' }}>
                                                <div style={{
                                                    maxWidth: '85%',
                                                    padding: '16px 20px',
                                                    borderRadius: '20px',
                                                    borderBottomLeftRadius: msg.author === 'Coordinador' ? '20px' : '4px',
                                                    borderBottomRightRadius: msg.author === 'Coordinador' ? '4px' : '20px',
                                                    background: msg.author === 'Coordinador' ? '#3b82f6' : '#f1f5f9',
                                                    color: msg.author === 'Coordinador' ? 'white' : '#1e293b',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', opacity: 0.9, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                                        <span>
                                                            {msg.author === 'Coordinador'
                                                                ? `Coordinación (${selectedTicket.coordinator_name || '?'})`
                                                                : (msg.original ? selectedTicket.student_name : `Respuesta de ${selectedTicket.student_name}`)
                                                            }
                                                        </span>
                                                        {msg.date && <span style={{ fontWeight: 'normal', opacity: 0.8 }}>{msg.date}</span>}
                                                    </div>
                                                    <div style={{ lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Current Coordinator Response */}
                                        {selectedTicket.coordinator_response && (
                                            <div style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
                                                <div style={{
                                                    maxWidth: '85%',
                                                    padding: '16px 20px',
                                                    borderRadius: '20px',
                                                    borderBottomLeftRadius: '20px',
                                                    borderBottomRightRadius: '4px',
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    border: '2px solid #60a5fa',
                                                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
                                                }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', opacity: 0.9 }}>
                                                        {selectedTicket.coordinator_name || 'Coordinación'} (Actual)
                                                    </div>
                                                    <div style={{ lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedTicket.coordinator_response}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Fecha Creación</div>
                                        <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>{new Date(selectedTicket.created_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Fecha Respuesta</div>
                                        <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>{selectedTicket.responded_at ? new Date(selectedTicket.responded_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }) : '-'}</div>
                                    </div>
                                    {selectedTicket.escalated_to_academic && (
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                                                Derivado a
                                            </div>
                                            <div style={{ color: '#7c3aed', fontSize: '14px', fontWeight: '600' }}>
                                                {selectedTicket.academic_name || academics.find(a => a.id === selectedTicket.academic_id)?.name || 'Profesor'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                Profesor
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Fecha Solución</div>
                                        <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>{selectedTicket.resolved_at ? new Date(selectedTicket.resolved_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }) : '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Valoración</div>
                                        <div style={{ color: '#f59e0b', fontSize: '14px' }}>
                                            {selectedTicket.satisfaction_rating ? '★'.repeat(selectedTicket.satisfaction_rating) : '-'}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Footer */}
                            <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', borderRadius: '0 0 24px 24px', gap: '12px' }}>
                                {selectedTicket.status === 'pendiente' && (
                                    <>
                                        <button
                                            onClick={() => { setShowRespondModal(true); }}
                                            style={{ padding: '10px 20px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            💬 Responder
                                        </button>
                                        <button
                                            onClick={() => { setShowEscalateModal(true); }}
                                            style={{ padding: '10px 20px', borderRadius: '12px', background: '#8b5cf6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            ➡️ Derivar
                                        </button>
                                    </>
                                )}
                                {(selectedTicket.status === 'derivado' || selectedTicket.status === 'respondido') && (
                                    <button
                                        onClick={() => {
                                            if (confirm('¿Marcar como solucionado?')) {
                                                completeTicket(selectedTicket.id).then(() => {
                                                    setSuccess('Ticket solucionado');
                                                    loadData();
                                                    setShowDetailModal(false);
                                                });
                                            }
                                        }}
                                        style={{ padding: '10px 20px', borderRadius: '12px', background: '#dcfce7', color: '#166534', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        ✔ Resolver
                                    </button>
                                )}

                                <button
                                    onClick={() => { setShowDeleteTicketModal(true); }}
                                    style={{ padding: '10px 20px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    🗑️ Eliminar
                                </button>

                                <button onClick={() => setShowDetailModal(false)} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* PROFILE EDIT MODAL */}
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
                onSuccess={(updatedUser) => {
                    handleProfileUpdate(updatedUser);
                    setSuccess('Perfil actualizado correctamente');
                    setTimeout(() => setSuccess(''), 3000);
                }}
            />
        </div >
    );
}
