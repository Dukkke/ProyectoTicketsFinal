'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Ticket, getStudentTickets, getAcademics, Academic, createTicket,
    TicketMessage, markNotificationAsRead, Notification, getNotifications,
    reopenTicket, resolveTicket
} from '@/lib/api';
import styles from './estudiante-remoto.module.css';
import { TicketList } from '@/components/features/Student/TicketList/TicketList';
import { ProfileModal } from '@/components/features/Student/ProfileModal/ProfileModal';
import { OnboardingModal } from '@/components/features/Student/OnboardingModal/OnboardingModal';
import { Ticket as TicketIcon, Bell, XCircle, CheckCircle, Settings } from 'lucide-react';

export default function EstudianteRemotoPage() {
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
    const [filter, setFilter] = useState<'activos' | 'archivados'>('activos');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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

    // View Ticket Details State
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [reopenReason, setReopenReason] = useState('');
    const [isReopening, setIsReopening] = useState(false);
    const [showReopenForm, setShowReopenForm] = useState(false);

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

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        // Strict Modality Check
        const validRemoteModalities = ['remota', 'online', 'vespertina', 'modalidad remota'];
        if (!validRemoteModalities.includes((parsedUser.modality || '').trim().toLowerCase())) {
            // Redirect unauthorized users (e.g. Diurna students trying to access Remote portal)
            alert('Acceso denegado. Este portal es solo para estudiantes de modalidad Remota/Online.');
            router.push('/estudiante');
            return;
        }
        setUser(parsedUser);
        loadData(parsedUser.id);

        // Check if Onboarding is needed
        if (!parsedUser.paternal_surname || !parsedUser.maternal_surname || !parsedUser.rut) {
            setShowOnboarding(true);
        }

    }, [router]);

    const loadData = async (userId: number) => {
        try {
            setLoading(true);
            const [ticketsData, academicsData, notificationsData] = await Promise.all([
                getStudentTickets(userId),
                getAcademics(),
                getNotifications(userId)
            ]);
            setTickets(ticketsData);
            setAcademics(academicsData);
            setNotifications(notificationsData);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Error al cargar información');
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>;
    if (!user) return null;

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div>
                    <div className={styles.logoContainer}>
                        <div className={styles.logoIcon}><TicketIcon size={24} /></div>
                        <div className={styles.logoText}>UAH Tickets</div>
                    </div>

                    <nav className={styles.nav}>
                        <button
                            className={`${styles.navButton} ${styles.navButtonActive}`}
                        >
                            <TicketIcon size={20} /> Mis Tickets
                        </button>

                        <div className={styles.sectionTitle}>Cuenta</div>
                        <button className={styles.navButton} onClick={() => setShowProfileModal(true)}>
                            <Settings size={20} />
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
                            Gestiona tus consultas y tickets de ayuda (Online).
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

                        <button className={styles.newTicketBtn} onClick={() => { setSelectedTicket(null); setShowModal(true); }}>
                            <TicketIcon size={20} /> Nuevo Ticket
                        </button>
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

                {/* Tickets List */}
                <TicketList
                    tickets={tickets}
                    filter={filter}
                    onFilterChange={setFilter}
                    onTicketClick={(ticket: Ticket) => { setSelectedTicket(ticket); setShowModal(true); }}
                    onCreateTicketClick={() => setShowModal(true)}
                />
            </main>

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
                        <h2 className={styles.modalTitle}>
                            {selectedTicket ? `Ticket #${selectedTicket.ticket_code}` : 'Nuevo Ticket de Consulta'}
                        </h2>

                        {selectedTicket ? (
                            // View Ticket Details Mode
                            <div className={styles.ticketDetails}>
                                <div className={styles.detailHeader}>
                                    <div className={styles.statusBadge}
                                        style={{
                                            background: selectedTicket.status === 'pendiente' ? '#fef3c7' :
                                                selectedTicket.status === 'solucionado' ? '#dcfce7' :
                                                    selectedTicket.status === 'rechazado' ? '#fee2e2' : '#e2e8f0',
                                            color: selectedTicket.status === 'pendiente' ? '#d97706' :
                                                selectedTicket.status === 'solucionado' ? '#166534' :
                                                    selectedTicket.status === 'rechazado' ? '#991b1b' : '#475569',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
                                        }}
                                    >
                                        {selectedTicket.status.toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        {new Date(selectedTicket.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className={styles.detailTitle}>{selectedTicket.title}</h3>
                                <div className={styles.detailDescription}>
                                    {selectedTicket.description}
                                </div>

                                {selectedTicket.rejection_reason && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                        <div style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '4px' }}>Motivo de Rechazo:</div>
                                        <p style={{ margin: 0, color: '#7f1d1d' }}>{selectedTicket.rejection_reason}</p>
                                    </div>
                                )}

                                {selectedTicket.coordinator_response && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                                        <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: '4px' }}>Respuesta de Coordinación:</div>
                                        <p style={{ margin: 0, color: '#0c4a6e' }}>{selectedTicket.coordinator_response}</p>
                                    </div>
                                )}

                                {/* Messages / Thread */}
                                {/* Logic to show messages would go here if we fetched them. For now relying on main fields. */}

                                {/* Actions: Reopen / Rate */}
                                <div className={styles.detailActions} style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>

                                    {/* Reopen Logic */}
                                    {(selectedTicket.status === 'solucionado' || selectedTicket.status === 'rechazado' || selectedTicket.status === 'completado') && (selectedTicket.reopen_count || 0) < 2 && (
                                        <div style={{ marginBottom: '16px' }}>
                                            {!showReopenForm ? (
                                                <button
                                                    onClick={() => setShowReopenForm(true)}
                                                    style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                                                >
                                                    Reabrir Ticket
                                                </button>
                                            ) : (
                                                <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#92400e' }}>Motivo de reapertura:</label>
                                                    <textarea
                                                        value={reopenReason}
                                                        onChange={(e) => setReopenReason(e.target.value)}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '60px', marginBottom: '8px' }}
                                                        placeholder="Explica por qué necesitas reabrir este caso..."
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={async () => {
                                                                if (!reopenReason.trim()) return;
                                                                setIsReopening(true);
                                                                try {
                                                                    await reopenTicket(selectedTicket.id, reopenReason);
                                                                    setSuccess('Ticket reabierto exitosamente');
                                                                    setShowModal(false);
                                                                    loadData(user.id);
                                                                } catch (err: any) {
                                                                    setError(err.message || 'Error al reabrir ticket');
                                                                } finally {
                                                                    setIsReopening(false);
                                                                }
                                                            }}
                                                            disabled={isReopening}
                                                            style={{ background: '#d97706', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            {isReopening ? 'Enviando...' : 'Confirmar'}
                                                        </button>
                                                        <button
                                                            onClick={() => setShowReopenForm(false)}
                                                            style={{ background: 'none', border: '1px solid #9ca3af', color: '#4b5563', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Rating Logic */}
                                    {(selectedTicket.status === 'solucionado' || selectedTicket.status === 'completado') && (
                                        !selectedTicket.satisfaction_rating ? (
                                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Califica la atención:</div>
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            onClick={() => setRating(star)}
                                                            style={{
                                                                background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px',
                                                                color: star <= rating ? '#eab308' : '#cbd5e1'
                                                            }}
                                                        >
                                                            ★
                                                        </button>
                                                    ))}
                                                </div>
                                                {(rating > 0) && (
                                                    <button
                                                        onClick={async () => {
                                                            setRatingSubmitting(true);
                                                            try {
                                                                await resolveTicket(selectedTicket.id, rating, ratingComment);
                                                                setSuccess('Gracias por tu calificación');
                                                                // Don't close modal immediately, reload so user sees the rating
                                                                // setShowModal(false); 
                                                                loadData(user.id);
                                                                setSelectedTicket(prev => prev ? { ...prev, satisfaction_rating: rating } : null);
                                                            } catch (err: any) {
                                                                setError('Error al enviar calificación');
                                                            } finally {
                                                                setRatingSubmitting(false);
                                                            }
                                                        }}
                                                        disabled={ratingSubmitting}
                                                        style={{ width: '100%', background: '#0f172a', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                                    >
                                                        {ratingSubmitting ? 'Enviando...' : 'Enviar Calificación'}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '16px' }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#166534' }}>Tu Calificación:</div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <span
                                                            key={star}
                                                            style={{
                                                                fontSize: '24px',
                                                                color: star <= selectedTicket.satisfaction_rating! ? '#eab308' : '#cbd5e1'
                                                            }}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#15803d', marginTop: '4px' }}>
                                                    ¡Gracias por tu opinión!
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            // Create Ticket Mode (Existing Form with slight format tweaks if needed)
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
                                    <button
                                        type="submit"
                                        className={`${styles.btnSubmit} ${isSubmitting ? styles.btnDisabled : ''}`}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Creando...' : 'Crear Ticket'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
