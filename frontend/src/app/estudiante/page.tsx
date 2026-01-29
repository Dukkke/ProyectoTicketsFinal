'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Ticket, getStudentTickets, getAcademics, Academic, createTicket,
    resolveTicket, reopenTicket, TicketMessage, getTicketMessages, sendTicketMessage,
    updateUser, onboardingChangePassword, archiveTicket,
    // Justification imports
    createJustification, getStudentJustifications, getNotifications, markNotificationAsRead, Notification
} from '@/lib/api';
import styles from './estudiante.module.css';
import { TicketList } from '@/components/features/Student/TicketList/TicketList';
import { ProfileModal } from '@/components/features/Student/ProfileModal/ProfileModal';
import { OnboardingModal } from '@/components/features/Student/OnboardingModal/OnboardingModal';


import { GraduationCap, Building2, Code2, Monitor, Laptop, ChevronDown, ChevronUp, ArrowRight, HelpCircle, Ticket as TicketIcon, Lock, Clock, CheckCircle, XCircle, FileText, Upload, Calendar, Bell } from 'lucide-react';


export default function EstudiantePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [academics, setAcademics] = useState<Academic[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // View states
    const [currentView, setCurrentView] = useState<'tickets' | 'justifications'>('tickets');
    const [filter, setFilter] = useState<'activos' | 'archivados'>('activos');

    // Justification states
    const [justifications, setJustifications] = useState<any[]>([]);
    const [showJustificationModal, setShowJustificationModal] = useState(false);
    const [jForm, setJForm] = useState({
        reasonType: 'Motivo de Salud',
        reasonDetail: '',
        startDate: '',
        endDate: '',
        affectedCourses: '',
        professors: [] as number[],
        files: [] as File[] // Changed to array
    });
    const [uploadingJustification, setUploadingJustification] = useState(false);

    // Filtered Tickets
    const filteredTickets = tickets.filter(t => {
        if (filter === 'activos') return !t.is_archived && !t.is_deleted;
        if (filter === 'archivados') return t.is_archived && !t.is_deleted;
        return true;
    });

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [rating, setRating] = useState(0);
    const [reopenReason, setReopenReason] = useState('');


    // Chat modal states
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatTicket, setChatTicket] = useState<Ticket | null>(null);
    const [chatMessages, setChatMessages] = useState<TicketMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Ticket form
    const [ticketForm, setTicketForm] = useState({
        title: '',
        description: '',
        ticket_type: '', // Will hold joined string of categories
        academic_id: '' as string | number,
        needs_professor: false
    });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Categories list
    const CATEGORIES = [
        { id: 'academica', label: 'Dudas Académicas' },
        { id: 'administrativa', label: 'Administrativas' },
        { id: 'horario', label: 'Horario' },
        { id: 'inscripcion', label: 'Inscripción de Ramos' },
        { id: 'dificultades', label: 'Dificultades' },
        { id: 'coordinacion', label: 'Coordinación Académica' },
        { id: 'vocacional', label: 'Vocacional' },
        { id: 'otro', label: 'Otro' }
    ];

    const handleCategoryChange = (categoryId: string) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(prev => prev.filter(id => id !== categoryId));
        } else {
            if (selectedCategories.length < 3) {
                setSelectedCategories(prev => [...prev, categoryId]);
            }
        }
    };

    // Update ticket_type when categories change
    useEffect(() => {
        const labels = selectedCategories.map(id => CATEGORIES.find(c => c.id === id)?.label || id);
        setTicketForm(prev => ({ ...prev, ticket_type: labels.join(' + ') }));
    }, [selectedCategories]);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);



    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'estudiante' && parsedUser.role !== 'ESTUDIANTE') {
            router.push('/login');
            return;
        }

        const userModality = (parsedUser.modality || '').trim().toLowerCase();
        // DEBUG: Temporary alert to verify modality
        alert(`DEBUG: Modality detected: "${parsedUser.modality}" (Normalized: "${userModality}")`);

        // Redirect Remote users to their correct portal
        const remoteModalities = ['remota', 'online', 'vespertina', 'modalidad remota'];
        if (remoteModalities.includes(userModality)) {
            router.push('/estudiante-remoto');
            return;
        }
        setUser(parsedUser);
        loadData(parsedUser.id);

        // Check if Onboarding is needed (missing surname or rut)
        if (!parsedUser.paternal_surname || !parsedUser.maternal_surname || !parsedUser.rut) {
            setShowOnboarding(true);
        }

        // Initialize profile form
        /* Profile form logic moved to ProfileModal */

    }, [router]);

    const loadData = async (userId: number) => {
        try {
            setLoading(true);
            const [ticketsData, academicsData, justificationsData, notificationsData] = await Promise.all([
                getStudentTickets(userId),
                getAcademics(),
                getStudentJustifications(userId),
                getNotifications(userId)
            ]);
            setTickets(ticketsData);
            setAcademics(academicsData);
            setNotifications(notificationsData);
            const jData = justificationsData as any;
            if (jData && jData.items) {
                setJustifications(jData.items);
            }
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Error al cargar información');
        } finally {
            setLoading(false);
        }
    };

    // ... (Existing Ticket Functions: handleCreateTicket, handleMessage, etc.)
    // Keeping them compact for clarity, assuming they are unchanged unless specified

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        try {
            await createTicket(user.id, {
                title: ticketForm.title,
                description: ticketForm.description,
                ticket_type: ticketForm.ticket_type || 'General',
                academic_id: ticketForm.academic_id ? Number(ticketForm.academic_id) : undefined,
                needs_professor: ticketForm.needs_professor
            });
            await loadData(user.id);
            setShowModal(false);
            setSuccess('Ticket creado exitosamente');
            setTicketForm({
                title: '', description: '', ticket_type: '', academic_id: '', needs_professor: false
            });
            setSelectedCategories([]);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al crear ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Justification Functions
    const handleCreateJustification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!jForm.reasonDetail || !jForm.reasonDetail.trim()) {
            setError('La descripción adicional es obligatoria');
            return;
        }

        if (!jForm.files || jForm.files.length === 0) {
            setError('Debes adjuntar al menos un justificativo médico (PDF)');
            return;
        }

        setUploadingJustification(true);
        try {
            const combinedReason = jForm.reasonDetail
                ? `${jForm.reasonType}: ${jForm.reasonDetail}`
                : jForm.reasonType;

            await createJustification({
                student_id: user.id,
                absence_reason: combinedReason,
                absence_start_date: new Date(jForm.startDate).toISOString(),
                absence_end_date: new Date(jForm.endDate).toISOString(),
                affected_courses: jForm.affectedCourses,
                professor_ids: jForm.professors,
                documents: jForm.files
            });

            await loadData(user.id);
            setShowJustificationModal(false);
            setSuccess('Justificativo enviado exitosamente');
            setJForm({
                reasonType: 'Motivo de Salud', reasonDetail: '', startDate: '', endDate: '', affectedCourses: '', professors: [], files: []
            });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al enviar justificativo');
        } finally {
            setUploadingJustification(false);
        }
    };



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            // Limit to 3 files
            if (selectedFiles.length > 3) {
                alert("Máximo 3 documentos permitidos. Se han seleccionado solo los primeros 3.");
                selectedFiles.splice(3);
            }

            // Check types
            const validFiles = selectedFiles.filter(file => file.type === 'application/pdf');

            if (validFiles.length !== selectedFiles.length) {
                alert("Algunos archivos no eran PDF y fueron descartados.");
            }

            if (validFiles.length > 0) {
                setJForm(prev => ({ ...prev, files: validFiles }));
                setError('');
            } else {
                e.target.value = ''; // Reset
                setJForm(prev => ({ ...prev, files: [] }));
            }
        }
    };

    const toggleProfessorSelection = (profId: number) => {
        setJForm(prev => {
            const current = prev.professors;
            if (current.includes(profId)) {
                return { ...prev, professors: current.filter(id => id !== profId) };
            } else {
                return { ...prev, professors: [...current, profId] };
            }
        });
    };

    const getStatusStyle = (status: string) => {
        const styles: Record<string, { bg: string; color: string; label: string }> = {
            pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
            respondido: { bg: '#dbeafe', color: '#1e40af', label: 'Respondido' },
            solucionado: { bg: '#dcfce7', color: '#166534', label: 'Solucionado' },
            aceptado: { bg: '#dbeafe', color: '#1e40af', label: 'Aceptado' },
            rechazado: { bg: '#fee2e2', color: '#b91c1c', label: 'Rechazado' },
            completado: { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
            derivado: { bg: '#e0e7ff', color: '#4338ca', label: 'Derivado' },
        };
        return styles[status] || styles.pendiente;
    };

    // Basic renders
    if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>;
    if (!user) return null;

    const isPresencial = !user.modality || user.modality === 'Diurna' || user.modality === 'Vespertina';

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div>
                    <div className={styles.logoContainer}>
                        <div className={styles.logoIcon}><TicketIcon size={24} /></div>
                        <div className={styles.logoText}>Te ayudamos FIN</div>
                    </div>

                    <nav className={styles.nav}>
                        <button
                            className={`${styles.navButton} ${currentView === 'tickets' ? styles.navButtonActive : ''}`}
                            onClick={() => setCurrentView('tickets')}
                        >
                            <TicketIcon size={20} /> Mis Tickets
                        </button>

                        {isPresencial && (
                            <button
                                className={`${styles.navButton} ${currentView === 'justifications' ? styles.navButtonActive : ''}`}
                                onClick={() => setCurrentView('justifications')}
                            >
                                <FileText size={20} /> Justificativos
                            </button>
                        )}




                        <div className={styles.sectionTitle}>Cuenta</div>
                        <button className={styles.navButton} onClick={() => setShowProfileModal(true)}>
                            <div className={styles.userAvatar} style={{ width: 24, height: 24, fontSize: 12 }}>
                                {user.name.charAt(0)}
                            </div>
                            Mis Datos
                        </button>
                    </nav>
                </div>

                <div className={styles.userCard}>
                    <div className={styles.userAvatar}>{user.name.charAt(0)}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userActions}>
                            <button onClick={() => {
                                localStorage.removeItem('user');
                                localStorage.removeItem('token');
                                router.push('/login');
                            }} className={`${styles.actionLink} ${styles.linkRed}`}>
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.greeting}>Hola, {user.name}</h1>
                        <p className={styles.subnet}>
                            {currentView === 'tickets' ? 'Gestiona tus consultas y tickets de ayuda.' : 'Gestiona tus justificaciones de inasistencia.'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    position: 'relative', background: 'white', border: 'none',
                                    padding: '10px', borderRadius: '12px', cursor: 'pointer',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Bell size={20} color="#64748b" />
                                {notifications.some(n => !n.is_read) && (
                                    <span style={{
                                        position: 'absolute', top: -5, right: -5,
                                        background: '#ef4444', color: 'white',
                                        fontSize: '10px', fontWeight: 'bold',
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {notifications.filter(n => !n.is_read).length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotifications && (
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0,
                                    width: '320px', background: 'white', borderRadius: '16px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100
                                }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Notificaciones</span>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                                <p style={{ margin: 0 }}>No tienes notificaciones</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} style={{
                                                    padding: '16px', borderBottom: '1px solid #f1f5f9',
                                                    background: n.is_read ? 'white' : '#f0f9ff',
                                                    transition: 'background 0.2s'
                                                }}>
                                                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: '#1e293b' }}>{n.title}</div>
                                                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0', lineHeight: '1.4' }}>{n.message}</p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                                            {new Date(n.created_at).toLocaleDateString()}
                                                        </span>
                                                        {!n.is_read && (
                                                            <button
                                                                style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: '600' }}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await markNotificationAsRead(n.id);
                                                                    loadData(user.id);
                                                                }}
                                                            >
                                                                Marcar como leída
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {currentView === 'tickets' ? (
                            <button className={styles.newTicketBtn} onClick={() => setShowModal(true)}>
                                <TicketIcon size={20} /> Nuevo Ticket
                            </button>
                        ) : (
                            <button className={styles.newTicketBtn} onClick={() => setShowJustificationModal(true)}>
                                <FileText size={20} /> Nuevo Justificativo
                            </button>
                        )}
                    </div>
                </header>

                {error && (
                    <div style={{ padding: '16px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{error}</span>
                        <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={20} color="#991b1b" /></button>
                    </div>
                )}

                {success && (
                    <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{success}</span>
                        <CheckCircle size={20} color="#166534" />
                    </div>
                )}

                {currentView === 'tickets' ? (
                    <>
                        {/* Tickets List */}
                        <TicketList
                            tickets={tickets}
                            filter={filter}
                            onFilterChange={setFilter}
                            onTicketClick={(ticket: Ticket) => { setSelectedTicket(ticket); setShowModal(true); }}
                            onCreateTicketClick={() => setShowModal(true)}
                        />
                    </>
                ) : (
                    // Justifications View
                    <div className="fade-in">
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {justifications.length > 0 ? (
                                justifications.map(j => (
                                    <div key={j.id} className={styles.ticketCard} style={{
                                        borderLeft: `4px solid ${j.status === 'pendiente' ? '#f59e0b' :
                                            j.status === 'aprobado' ? '#10b981' : '#ef4444'
                                            }`
                                    }}>
                                        <div className={styles.ticketHeader}>
                                            <span className={styles.ticketCode}>Justificativo #{j.id}</span>
                                            <span className={styles.ticketBadge} style={{
                                                background: j.status === 'pendiente' ? '#fef3c7' :
                                                    j.status === 'aprobado' ? '#d1fae5' : '#fee2e2',
                                                color: j.status === 'pendiente' ? '#d97706' :
                                                    j.status === 'aprobado' ? '#047857' : '#b91c1c'
                                            }}>
                                                {j.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                                            <div>
                                                <div className={styles.label}>Fecha Inicio</div>
                                                <div style={{ fontWeight: 600 }}>{new Date(j.absence_start_date).toLocaleDateString()}</div>
                                            </div>
                                            <div>
                                                <div className={styles.label}>Fecha Fin</div>
                                                <div style={{ fontWeight: 600 }}>{new Date(j.absence_end_date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <h3 className={styles.ticketTitle}>Motivo: {j.absence_reason}</h3>
                                        <div className={styles.ticketDesc}>
                                            <span style={{ fontWeight: 600 }}>Cursos afectados:</span> {j.affected_courses}
                                        </div>
                                        {j.rejection_reason && (
                                            <div style={{ padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#b91c1c', marginTop: '12px' }}>
                                                <strong>Motivo de rechazo:</strong> {j.rejection_reason}
                                            </div>
                                        )}
                                        <div className={styles.ticketFooter}>
                                            <span className={styles.ticketDate}>Enviado el {new Date(j.created_at).toLocaleDateString()}</span>
                                            {j.document_filename && Array.isArray(j.document_filename) && j.document_filename.map((fname: string, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={`http://localhost:8000/api/justifications/document/${j.document_path?.[idx] || fname}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                                                >
                                                    <FileText size={16} /> {fname}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}><FileText size={48} color="#94a3b8" /></div>
                                    <p>No tienes justificativos enviados.</p>
                                    <button className={styles.createEmptyBtn} onClick={() => setShowJustificationModal(true)}>
                                        Crear Justificativo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Justification Modal */}
            {showJustificationModal && user && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
                        <h2 className={styles.modalTitle}>Nuevo Justificativo de Inasistencia</h2>

                        <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#0369a1' }}>Datos del Estudiante</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '14px' }}>
                                <div>
                                    <span style={{ color: '#64748b' }}>Nombre:</span>
                                    <div style={{ fontWeight: 600 }}>{user.name} {user.paternal_surname}</div>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b' }}>RUT:</span>
                                    <div style={{ fontWeight: 600 }}>{user.rut}</div>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b' }}>Año Ingreso:</span>
                                    <div style={{ fontWeight: 600 }}>{user.admission_year || '-'}</div>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b' }}>Email:</span>
                                    <div style={{ fontWeight: 600 }}>{user.email}</div>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b' }}>Teléfono:</span>
                                    <div style={{ fontWeight: 600 }}>{user.phone || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCreateJustification}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tipo de Motivo</label>
                                <select
                                    className={styles.select}
                                    value={jForm.reasonType}
                                    onChange={e => setJForm({ ...jForm, reasonType: e.target.value })}
                                    required
                                >
                                    <option value="Motivo de Salud">Motivo de Salud</option>
                                    <option value="Fuerza Mayor">Fuerza Mayor</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Descripción Adicional <span style={{ color: '#ef4444' }}>*</span></label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Detalles adicionales..."
                                    value={jForm.reasonDetail}
                                    onChange={e => setJForm({ ...jForm, reasonDetail: e.target.value })}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={jForm.startDate}
                                        onChange={e => setJForm({ ...jForm, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Fecha Término</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={jForm.endDate}
                                        onChange={e => setJForm({ ...jForm, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Asignaturas Afectadas</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Ej: Cálculo I, Física II, Programación..."
                                    value={jForm.affectedCourses}
                                    onChange={e => setJForm({ ...jForm, affectedCourses: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Notificar a Profesores</label>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px' }}>
                                    {academics.map(acad => (
                                        <div
                                            key={acad.id}
                                            onClick={() => toggleProfessorSelection(acad.id)}
                                            style={{
                                                padding: '8px',
                                                cursor: 'pointer',
                                                background: jForm.professors.includes(acad.id) ? '#eff6ff' : 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <div style={{
                                                width: '16px', height: '16px', borderRadius: '4px',
                                                border: '1px solid #cbd5e1',
                                                background: jForm.professors.includes(acad.id) ? '#3b82f6' : 'white'
                                            }} />
                                            {acad.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <label className={styles.label}>
                                    Adjuntar Documentos (PDF)
                                    <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal', marginLeft: '8px' }}>
                                        (Máximo 3 archivos. No es obligatorio subir los 3, pero es el límite.)
                                    </span>
                                </label>
                                <div style={{
                                    border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '24px',
                                    textAlign: 'center', cursor: 'pointer', background: '#f8fafc',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                                }} onClick={() => document.getElementById('file-upload')?.click()}>
                                    <Upload size={32} color="#94a3b8" />
                                    <div style={{ color: '#64748b', fontSize: '14px' }}>
                                        {jForm.files && jForm.files.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ color: '#0369a1', fontWeight: '600' }}>
                                                    {jForm.files.length} archivo(s) seleccionado(s)
                                                </span>
                                                {jForm.files.map((f, idx) => (
                                                    <span key={idx} style={{ fontSize: '12px' }}>{f.name}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span>Haz clic para subir los documentos (PDF)</span>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            <div className={styles.modalButtons}>
                                <button
                                    type="button"
                                    className={styles.btnCancel}
                                    onClick={() => setShowJustificationModal(false)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    ← Volver
                                </button>
                                <button
                                    type="submit"
                                    className={`${styles.btnSubmit} ${uploadingJustification ? styles.btnDisabled : ''}`}
                                    disabled={uploadingJustification}
                                >
                                    {uploadingJustification ? 'Enviando...' : 'Enviar Justificativo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
                onSuccess={() => loadData(user.id)}
            />

            {/* Onboarding Modal */}
            <OnboardingModal
                isOpen={showOnboarding}
                user={user}
                onSuccess={async (updatedUser: User) => {
                    localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
                    setUser(updatedUser);
                    setShowOnboarding(false);
                    await loadData(updatedUser.id);
                }}
            />
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 className={styles.modalTitle}>Nuevo Ticket de Consulta</h2>
                        <form onSubmit={handleCreateTicket}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Título Asunto</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={ticketForm.title}
                                    onChange={e => setTicketForm({ ...ticketForm, title: e.target.value })}
                                    required
                                    placeholder="Ej: Dudas sobre toma de ramos"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Categoría</label>
                                <div className={styles.categoryGrid}>
                                    {CATEGORIES.map(cat => (
                                        <div
                                            key={cat.id}
                                            className={`${styles.categoryItem} ${selectedCategories.includes(cat.id) ? styles.categorySelected : ''}`}
                                            onClick={() => handleCategoryChange(cat.id)}
                                        >
                                            {cat.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Descripción</label>
                                <textarea
                                    className={styles.textarea}
                                    value={ticketForm.description}
                                    onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                                    required
                                    placeholder="Detalla tu consulta aquí..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        checked={ticketForm.needs_professor}
                                        onChange={e => setTicketForm({ ...ticketForm, needs_professor: e.target.checked })}
                                    />
                                    <span style={{ fontSize: '14px', color: '#475569' }}>Requiere escalar a profesor</span>
                                </label>
                            </div>

                            {ticketForm.needs_professor && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Seleccionar Profesor (Opcional)</label>
                                    <select
                                        className={styles.select}
                                        value={ticketForm.academic_id}
                                        onChange={e => setTicketForm({ ...ticketForm, academic_id: e.target.value })}
                                    >
                                        <option value="">-- Seleccione un académico --</option>
                                        {academics.map(acad => (
                                            <option key={acad.id} value={acad.id}>{acad.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className={styles.modalButtons}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? 'Creando...' : 'Crear Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
                        <button className={styles.closeModalBtn} onClick={() => setShowProfileModal(false)}>×</button>
                        <h2 className={styles.modalTitle}>Mis Datos</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>Nombres</div>
                                <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.name}</div>
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>RUT</div>
                                <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.rut || '-'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>Apellido Paterno</div>
                                <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.paternal_surname || '-'}</div>
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>Apellido Materno</div>
                                <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.maternal_surname || '-'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>Año Ingreso</div>
                                <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.admission_year || '-'}</div>
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>Correo Personal</div>
                                <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.personal_email || '-'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>Teléfono</div>
                                <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.phone || '-'}</div>
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>Teléfono Emergencia</div>
                                <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.emergency_phone || '-'}</div>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.label}>Correo Institucional</div>
                            <div className={styles.input} style={{ background: '#f1f5f9' }}>{user.email}</div>
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                className={styles.btnSubmit}
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setShowOnboarding(true); // Re-open onboarding to edit
                                }}
                                style={{ background: '#4f46e5' }}
                            >
                                Editar Información
                            </button>
                            <button className={styles.btnCancel} onClick={() => setShowProfileModal(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAQ Overlay */}

        </div>
    );
}

