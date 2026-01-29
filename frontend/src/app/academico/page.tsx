'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Ticket, Stats, Course, getAcademicTickets, getAcademicStats, getAcademicCourses, getCourseStudents, acceptTicket, rejectTicket, completeTicket, academicRespondTicket, TicketMessage, getTicketMessages, sendTicketMessage, getProfessorJustifications, markViewedJustification } from '@/lib/api';
import {
    Clock, CheckCircle, XCircle, FileText, Ticket as TicketIcon, BookOpen,
    BarChart, Flame, CheckSquare, MessageSquare, AlertTriangle, ArrowRight, Trash2,
    Calendar, User as UserIcon, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { AcademicOnboardingModal } from '@/components/features/Academic/AcademicOnboardingModal';
import NotificationBell from '@/components/shared/NotificationBell';

// --- CUSTOM CALENDAR COMPONENT ---
const CalendarWidget = ({ tickets, onDateSelect, selectedDate }: { tickets: Ticket[], onDateSelect: (date: string | null) => void, selectedDate: string | null }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Sunday
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate); // 0-6
    // Adjust for Monday start if needed, but standard US/ISO often starts Sun. Let's use Sunday start for simplicity or Monday.
    // Let's assume standardized 0=Sunday.

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    const hasEvent = (day: number) => {
        // Check if there are tickets for this day
        // Ticket dates are usually ISO strings
        return tickets.some(t => {
            if (!t.proposed_date) return false;
            const tDate = new Date(t.proposed_date);
            return tDate.getDate() === day && tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        const sDate = new Date(selectedDate);
        return day === sDate.getDate() && currentDate.getMonth() === sDate.getMonth() && currentDate.getFullYear() === sDate.getFullYear();
    };

    const handleDayClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Toggle: if already selected, deselect
        if (isSelected(day)) {
            onDateSelect(null);
        } else {
            onDateSelect(clickedDate.toISOString());
        }
    };

    const renderDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: '40px' }}></div>);
        }
        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const hasEvt = hasEvent(d);
            const selected = isSelected(d);
            const today = isToday(d);

            days.push(
                <div
                    key={d}
                    onClick={() => handleDayClick(d)}
                    style={{
                        height: '40px', width: '40px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        background: selected ? '#4f46e5' : (today ? '#e0e7ff' : 'transparent'),
                        color: selected ? 'white' : (today ? '#4f46e5' : '#1e293b'),
                        fontWeight: selected || today ? 'bold' : 'normal',
                        position: 'relative',
                        transition: 'all 0.2s',
                        margin: 'auto'
                    }}
                >
                    {d}
                    {hasEvt && !selected && (
                        <div style={{
                            width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444',
                            position: 'absolute', bottom: '6px'
                        }}></div>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <div style={{
            background: 'white', borderRadius: '24px', padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)', height: '100%'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handlePrevMonth} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={16} /></button>
                    <button onClick={handleNextMonth} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#64748b' }}><ChevronRight size={16} /></button>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                    <div key={i} style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{d}</div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '8px' }}>
                {renderDays()}
            </div>
            <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '12px' }}>Próximos Eventos</h4>
                {/* Minimal preview of next 2 upcoming tickets */}
                {tickets
                    .filter(t => t.status === 'aceptado' || t.status === 'pendiente')
                    .sort((a, b) => new Date(a.proposed_date).getTime() - new Date(b.proposed_date).getTime())
                    .slice(0, 3)
                    .map(t => (
                        <div key={t.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: t.status === 'aceptado' ? '#dcfce7' : '#fef3c7',
                                color: t.status === 'aceptado' ? '#166534' : '#92400e',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'
                            }}>
                                {new Date(t.proposed_date).getDate()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{t.title}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(t.proposed_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {t.student_name}</div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default function AcademicoPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [filter, setFilter] = useState(() => {

        if (typeof window !== 'undefined') {
            return localStorage.getItem('academic_filter') || 'pendiente';
        }
        return 'pendiente';
    });

    const [selectedDate, setSelectedDate] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('academic_selectedDate') || null;
        }
        return null;
    });

    const [activeTab, setActiveTab] = useState<'tickets' | 'ramos' | 'justifications'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('academic_activeTab');
            return (saved === 'tickets' || saved === 'ramos' || saved === 'justifications') ? saved : 'tickets';
        }
        return 'tickets';
    });
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseStudents, setSelectedCourseStudents] = useState<User[]>([]);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [selectedCourseName, setSelectedCourseName] = useState('');

    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [confirmedDate, setConfirmedDate] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [respondMessage, setRespondMessage] = useState('');
    const [quickNotes, setQuickNotes] = useState('');

    // Chat modal states
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatTicket, setChatTicket] = useState<Ticket | null>(null);
    const [chatMessages, setChatMessages] = useState<TicketMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Justifications State
    const [justifications, setJustifications] = useState<any[]>([]);
    const [loadingJustifications, setLoadingJustifications] = useState(false);
    const [selectedJustification, setSelectedJustification] = useState<any>(null);
    const [showJustificationModal, setShowJustificationModal] = useState(false);

    const loadJustifications = async (userId: number) => {
        setLoadingJustifications(true);
        try {
            const data = await getProfessorJustifications(userId);
            setJustifications(data.items || []);
        } catch (error) {
            console.error('Error loading justifications:', error);
        } finally {
            setLoadingJustifications(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'justifications' && user) {
            loadJustifications(user.id);
        }
    }, [activeTab, user]);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [newMessage]);

    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendingMessage) handleSendMessage();
        }
    };

    useEffect(() => {
        const savedNotes = localStorage.getItem('academic_notes');
        if (savedNotes) setQuickNotes(savedNotes);
    }, []);

    // Persist filter to localStorage
    useEffect(() => {
        localStorage.setItem('academic_filter', filter);
    }, [filter]);

    // Persist activeTab to localStorage
    useEffect(() => {
        localStorage.setItem('academic_activeTab', activeTab);
    }, [activeTab]);

    // Persist selectedDate to localStorage
    useEffect(() => {
        if (selectedDate) {
            localStorage.setItem('academic_selectedDate', selectedDate);
        } else {
            localStorage.removeItem('academic_selectedDate');
        }
    }, [selectedDate]);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setQuickNotes(newValue);
        localStorage.setItem('academic_notes', newValue);
    };

    const loadData = async (userId: number) => {
        try {
            const [ticketsData, statsData, coursesData] = await Promise.all([
                getAcademicTickets(userId),
                getAcademicStats(userId),
                getAcademicCourses(userId),
            ]);
            setTickets(ticketsData);
            setStats(statsData);
            setCourses(coursesData);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const userData = JSON.parse(storedUser);
        // Validate role - only allow academics
        if (userData.role?.toLowerCase() !== 'academico') {
            router.push('/login');
            return;
        }
        setUser(userData);
        loadData(userData.id);

        // Check if Onboarding is needed (missing surname or rut)
        if (!userData.paternal_surname || !userData.maternal_surname || !userData.rut) {
            setShowOnboarding(true);
        }
    }, [router]);


    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    const handleAccept = async () => {
        if (!selectedTicket || !confirmedDate) return;
        setActionLoading(true);
        try {
            await acceptTicket(selectedTicket.id, new Date(confirmedDate).toISOString());
            setShowAcceptModal(false);
            setSuccessMessage(`Ticket aceptado para el ${new Date(confirmedDate).toLocaleDateString()}`);
            setTimeout(() => setSuccessMessage(''), 3000);
            setSelectedTicket(null);
            setConfirmedDate('');
            if (user) loadData(user.id);
        } catch (err) {
            console.error('Error accepting ticket:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedTicket || !rejectReason) return;
        setActionLoading(true);
        try {
            await rejectTicket(selectedTicket.id, rejectReason);
            setShowRejectModal(false);
            setSuccessMessage('Ticket rechazado correctamente');
            setTimeout(() => setSuccessMessage(''), 3000);
            setSelectedTicket(null);
            setRejectReason('');
            if (user) loadData(user.id);
        } catch (err) {
            console.error('Error rejecting ticket:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async (ticketId: number) => {
        try {
            await completeTicket(ticketId);
            setSuccessMessage('Ticket marcado como completado 🎉');
            setTimeout(() => setSuccessMessage(''), 3000);
            if (user) loadData(user.id);
        } catch (err) {
            console.error('Error completing ticket:', err);
        }
    };

    const handleAcademicRespond = async () => {
        if (!selectedTicket || !respondMessage || !user) return;
        setActionLoading(true);
        try {
            await academicRespondTicket(selectedTicket.id, respondMessage, user.id);
            setShowRespondModal(false);
            setSuccessMessage('Respuesta enviada al estudiante ✅');
            setTimeout(() => setSuccessMessage(''), 3000);
            setSelectedTicket(null);
            setRespondMessage('');
            loadData(user.id);
        } catch (err) {
            console.error('Error responding to ticket:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewStudents = async (courseId: number, courseName: string) => {
        setActionLoading(true);
        try {
            const students = await getCourseStudents(courseId);
            setSelectedCourseStudents(students);
            setSelectedCourseName(courseName);
            setShowStudentModal(true);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // Chat functions
    const openChat = async (ticket: Ticket) => {
        setChatTicket(ticket);
        setShowChatModal(true);
        setLoadingMessages(true);
        setNewMessage('');

        try {
            const messages = await getTicketMessages(ticket.id);
            setChatMessages(messages);
        } catch (err) {
            console.error('Error loading messages:', err);
            setChatMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatTicket || !user || !newMessage.trim()) return;

        setSendingMessage(true);
        try {
            const message = await sendTicketMessage(
                chatTicket.id,
                newMessage.trim(),
                user.id,
                'academico'
            );
            setChatMessages(prev => [...prev, message]);
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSendingMessage(false);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.focus();
            }
        }
    };

    const closeChat = () => {
        setShowChatModal(false);
        setChatTicket(null);
        setChatMessages([]);
        setNewMessage('');
    };

    // Filter Logic
    const filteredTickets = tickets.filter(t => {
        // Date filter
        if (selectedDate) {
            const tDate = new Date(t.proposed_date);
            const sDate = new Date(selectedDate);
            const isSameDay = tDate.getDate() === sDate.getDate() && tDate.getMonth() === sDate.getMonth() && tDate.getFullYear() === sDate.getFullYear();
            if (!isSameDay) return false;
        }
        // Status Filter
        if (filter === 'all') {
            return true; // Show all tickets
        }
        if (filter === 'completado') {
            return t.status === 'completado' || t.status === 'solucionado'; // Show both completed and solved
        }
        if (filter === 'pendiente') {
            return t.status === 'pendiente' || t.status === 'derivado'; // Show both pending and escalated (derivado)
        }
        if (filter === 'respondido') {
            return t.status === 'respondido'; // Show responded tickets
        }
        return t.status === filter;
    });

    const getStatusStyle = (status: string) => {
        const styles: Record<string, { bg: string; color: string; label: string }> = {
            pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
            respondido: { bg: '#dbeafe', color: '#1e40af', label: 'Respondido' },
            solucionado: { bg: '#dcfce7', color: '#166534', label: 'Solucionado' },
            aceptado: { bg: '#dbeafe', color: '#1e40af', label: 'Aceptado' },
            rechazado: { bg: '#fee2e2', color: '#b91c1c', label: 'Rechazado' },
            completado: { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
        };
        return styles[status] || styles.pendiente;
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
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
            <AcademicOnboardingModal
                isOpen={showOnboarding}
                user={user}
                onSuccess={(updatedUser) => {
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local session
                    setShowOnboarding(false);
                    setSuccessMessage('¡Perfil completado exitosamente!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                }}
            />
            {/* SIDEBAR */}
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
                            <UserIcon size={24} />
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
                                textAlign: 'left', fontSize: '15px', fontWeight: '600',
                                boxShadow: activeTab === 'tickets' ? '0 8px 20px rgba(30, 41, 59, 0.25)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <TicketIcon size={20} /> Tickets
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('ramos');
                                // Fetch courses if not loaded
                                // if (courses.length === 0) loadCourses(); 
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '16px',
                                padding: '16px 20px', borderRadius: '16px',
                                background: activeTab === 'ramos' ? '#1e293b' : 'transparent',
                                color: activeTab === 'ramos' ? 'white' : '#64748b',
                                border: 'none', cursor: 'pointer',
                                textAlign: 'left', fontSize: '15px', fontWeight: '600',
                                boxShadow: activeTab === 'ramos' ? '0 8px 20px rgba(30, 41, 59, 0.25)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <BookOpen size={20} /> Ramos
                        </button>
                        <button
                            onClick={() => setActiveTab('justifications')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '16px',
                                padding: '16px 20px', borderRadius: '16px',
                                background: activeTab === 'justifications' ? '#1e293b' : 'transparent',
                                color: activeTab === 'justifications' ? 'white' : '#64748b',
                                border: 'none', cursor: 'pointer',
                                textAlign: 'left', fontSize: '15px', fontWeight: '600',
                                boxShadow: activeTab === 'justifications' ? '0 8px 20px rgba(30, 41, 59, 0.25)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <FileText size={20} /> Justificativos
                        </button>
                        {/* More menu items could be added here */}
                        <div style={{ marginTop: '24px', paddingLeft: '20px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>RESUMEN</div>
                        <div style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Tickets</span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{stats?.total_tickets || 0}</span>
                        </div>
                    </nav>
                </div>

                <div style={{ background: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                        <button onClick={handleLogout} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: '500' }}>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                            Bienvenido, {user?.name?.split(' ')[0]} 👋
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '16px' }}>Gestiona tus clases y consultas estudiantiles.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {/* Quick Access Icons */}
                        <div style={{ display: 'flex', gap: '12px', background: 'white', padding: '8px 12px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                            {[
                                { name: 'U-Campus', url: 'https://ucampus.uahurtado.cl/', img: '/icons/UcampusLogo.png' },
                                { name: 'Outlook', url: 'https://outlook.office.com', img: '/icons/OutlookLogo.jfif' },
                                { name: 'Teams', url: 'https://teams.microsoft.com', img: '/icons/TeamsLogo.jfif' },
                                { name: 'Gmail', url: 'https://mail.google.com', img: '/icons/GmailLogo.png' },
                                { name: 'LinkedIn', url: 'https://www.linkedin.com', img: '/icons/LogoLinkediN.png' }
                            ].map((app, idx) => (
                                <a key={idx} href={app.url} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'block', width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', transition: 'transform 0.2s' }}
                                    title={`Ir a ${app.name}`}>
                                    <img src={app.img} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </a>
                            ))}
                        </div>

                        {successMessage && (
                            <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 20px', borderRadius: '30px', fontWeight: '600', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' }}>
                                {successMessage}
                            </div>
                        )}

                        {user && <NotificationBell userId={user.id} />}
                    </div>
                </header>

                {/* STATS WIDGETS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '40px' }}>
                    {activeTab === 'justifications' ? (
                        /* Justification Stats */
                        [
                            { label: 'Total', value: justifications.length, color: '#64748b', bg: '#f1f5f9', icon: <FileText size={24} />, filter: 'all' },
                            { label: 'Pendientes', value: justifications.filter(j => j.status === 'PENDIENTE').length, color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={24} />, filter: 'pendiente' },
                            { label: 'Aprobados', value: justifications.filter(j => j.status === 'APROBADO').length, color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle size={24} />, filter: 'aprobado' },
                            { label: 'Rechazados', value: justifications.filter(j => j.status === 'RECHAZADO').length, color: '#ef4444', bg: '#fee2e2', icon: <XCircle size={24} />, filter: 'rechazado' },
                        ].map((stat, idx) => (
                            <div key={idx} style={{
                                flex: '1 1 200px',
                                background: 'white', padding: '24px', borderRadius: '24px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                border: '2px solid transparent', // No filter click for now on justifications stats as they are just info or we implement filters later
                                display: 'flex', flexDirection: 'column', gap: '12px',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {stat.icon}
                                    </div>
                                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#1e293b', lineHeight: 1 }}>
                                        {stat.value}
                                    </div>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{stat.label}</div>
                            </div>
                        ))
                    ) : (
                        /* Ticket Stats */
                        [
                            { label: 'Total', value: stats?.total_tickets || 0, color: '#3b82f6', bg: '#eff6ff', icon: <BarChart size={24} />, filter: 'all' },
                            { label: 'Pendientes', value: stats?.pending || 0, color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={24} />, filter: 'pendiente' },
                            { label: 'Respondidos', value: stats?.responded || 0, color: '#10b981', bg: '#ecfdf5', icon: <MessageSquare size={24} />, filter: 'respondido' },
                            { label: 'Completados', value: stats?.completed || 0, color: '#8b5cf6', bg: '#f5f3ff', icon: <CheckSquare size={24} />, filter: 'completado' },
                        ].map((stat, idx) => (
                            <div key={idx} onClick={() => setFilter(stat.filter)} style={{
                                flex: '1 1 200px',
                                background: 'white', padding: '24px', borderRadius: '24px',
                                boxShadow: filter === stat.filter ? '0 8px 30px rgba(59, 130, 246, 0.15)' : '0 4px 20px rgba(0,0,0,0.02)',
                                border: filter === stat.filter ? `2px solid ${stat.color}` : '2px solid transparent',
                                display: 'flex', flexDirection: 'column', gap: '12px',
                                cursor: 'pointer', transition: 'all 0.2s',
                                transform: filter === stat.filter ? 'translateY(-4px)' : 'none'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {stat.icon}
                                    </div>
                                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#1e293b', lineHeight: 1 }}>
                                        {stat.value}
                                    </div>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{stat.label}</div>
                            </div>
                        ))
                    )}
                </div>

                {activeTab === 'tickets' ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
                        {/* LEFT COLUMN: TICKET LIST */}
                        <div style={{ flex: '1 1 500px', minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                                    {selectedDate ? `Tickets del ${new Date(selectedDate).toLocaleDateString()}` : 'Solicitudes Recientes'}
                                </h3>
                                {selectedDate && (
                                    <button onClick={() => setSelectedDate(null)} style={{ color: '#4f46e5', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                                        Ver Todos
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {filteredTickets.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'rgba(255,255,255,0.5)', borderRadius: '24px' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                                        <p>No hay tickets para mostrar.</p>
                                    </div>
                                ) : (
                                    filteredTickets.map(ticket => {
                                        const statusStyle = getStatusStyle(ticket.status);
                                        return (
                                            <div key={ticket.id} style={{
                                                background: 'white', borderRadius: '24px', padding: '24px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                                border: '1px solid #f8fafc',
                                                transition: 'transform 0.2s', position: 'relative', overflow: 'hidden'
                                            }}>
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: statusStyle.bg }}></div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
                                                        {ticket.ticket_code}
                                                    </div>
                                                    <div style={{
                                                        background: statusStyle.bg, color: statusStyle.color,
                                                        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase'
                                                    }}>
                                                        {statusStyle.label}
                                                    </div>
                                                </div>

                                                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{ticket.title}</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                                                    {(() => {
                                                        const parts = ticket.description.split(/\n\n--- /);
                                                        return parts.map((part, idx) => {
                                                            if (idx === 0) {
                                                                // Mensaje inicial del estudiante
                                                                return (
                                                                    <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🎓</div>
                                                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '0 16px 16px 16px', maxWidth: '85%', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                                                                            {part}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            const headerEnd = part.indexOf(' ---\n');
                                                            if (headerEnd === -1) return null;

                                                            const header = part.substring(0, headerEnd);
                                                            const body = part.substring(headerEnd + 5);

                                                            const isReopen = header.includes('Reabierto');
                                                            const isResponse = header.includes('Respuesta');

                                                            if (isReopen) {
                                                                return (
                                                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '100%', margin: '8px 0' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8, marginBottom: '8px' }}>
                                                                            <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }}></div>
                                                                            <div style={{ fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '4px 12px', borderRadius: '12px' }}>
                                                                                {header}
                                                                            </div>
                                                                            <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }}></div>
                                                                        </div>
                                                                        <div style={{ width: '100%', padding: '12px', background: '#fffbeb', borderRadius: '12px', fontSize: '13px', color: '#92400e', borderLeft: '3px solid #f59e0b', lineHeight: '1.4' }}>
                                                                            {body}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            // Responses (Coordinator or Academic)
                                                            return (
                                                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', marginRight: '8px' }}>
                                                                        {header.replace('Respuesta Anterior de ', '')}
                                                                    </div>
                                                                    <div style={{ background: '#eff6ff', color: '#1e3a8a', padding: '12px 16px', borderRadius: '16px 0 16px 16px', maxWidth: '85%', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.05)' }}>
                                                                        {body}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            👨‍🎓 <strong>{ticket.student_name}</strong>
                                                            {ticket.student_modality && (
                                                                <span style={{
                                                                    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                                    background: ticket.student_modality.toLowerCase().includes('vespertina') ? '#4f46e5' : '#f59e0b',
                                                                    color: 'white', marginLeft: '6px'
                                                                }}>
                                                                    {ticket.student_modality}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            📅 {new Date(ticket.proposed_date).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {/* Chat button - always visible */}
                                                        <button
                                                            onClick={() => openChat(ticket)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                borderRadius: '12px',
                                                                border: 'none',
                                                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                                color: 'white',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            💬 Ver Chat
                                                        </button>
                                                        {ticket.status === 'pendiente' && (
                                                            <>
                                                                <button
                                                                    onClick={() => { setSelectedTicket(ticket); setShowRejectModal(true); }}
                                                                    style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}
                                                                >
                                                                    Rechazar
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSelectedTicket(ticket); setShowAcceptModal(true); }}
                                                                    style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                                                                >
                                                                    Aceptar
                                                                </button>
                                                            </>
                                                        )}
                                                        {ticket.status === 'derivado' && (
                                                            <>
                                                                <button
                                                                    onClick={() => { setSelectedTicket(ticket); setShowRespondModal(true); }}
                                                                    style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: '#1e293b', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                                                >
                                                                    Responder
                                                                </button>
                                                                <button
                                                                    onClick={() => handleComplete(ticket.id)}
                                                                    style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                                                >
                                                                    Marcar Resuelto
                                                                </button>
                                                            </>
                                                        )}
                                                        {ticket.status === 'aceptado' && (
                                                            <button
                                                                onClick={() => handleComplete(ticket.id)}
                                                                style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}
                                                            >
                                                                Marcar Completado
                                                            </button>
                                                        )}
                                                        {ticket.status === 'respondido' && (
                                                            <button
                                                                onClick={() => handleComplete(ticket.id)}
                                                                style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                                            >
                                                                Marcar Resuelto
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: NOTES & CALENDAR */}
                        <div style={{ flex: '0 0 340px', maxWidth: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* QUICK NOTES WIDGET */}
                                <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '20px', background: '#fef3c7', padding: '6px', borderRadius: '8px' }}>📝</span>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>Notas Mentales</h3>
                                    </div>
                                    <textarea
                                        value={quickNotes}
                                        onChange={handleNotesChange}
                                        placeholder="Escribe recordatorios, ideas o pendientes aquí..."
                                        style={{
                                            width: '100%', height: '140px', padding: '16px', borderRadius: '16px',
                                            border: 'none', background: '#f8fafc', resize: 'none',
                                            fontSize: '14px', lineHeight: '1.5', color: '#334155',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                    />
                                    <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                                        Se guarda automáticamente
                                    </div>
                                </div>

                                <CalendarWidget
                                    tickets={tickets}
                                    selectedDate={selectedDate}
                                    onDateSelect={setSelectedDate}
                                />

                                {/* Optional: Quick Tip or Mini-list */}
                                <div style={{ marginTop: '24px', background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '24px', padding: '24px', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>💡 Tips</h4>
                                    <p style={{ fontSize: '13px', lineHeight: '1.6', opacity: 0.8 }}>
                                        Recuerda confirmar la hora de las citas con los estudiantes para evitar conflictos de horario.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'justifications' ? (
                    // --- JUSTIFICATIONS VIEW ---
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Justificativos Estudiantiles</h3>
                        </div>

                        {loadingJustifications ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando justificativos...</div>
                        ) : justifications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                                <p style={{ color: '#64748b' }}>No tienes justificativos asignados.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                {justifications.map((justif) => (
                                    <div key={justif.id} style={{
                                        background: 'white', borderRadius: '24px', padding: '24px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9',
                                        position: 'relative', overflow: 'hidden'
                                    }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8b5cf6' }}></div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: '#f5f3ff', color: '#8b5cf6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 'bold', fontSize: '14px'
                                                }}>
                                                    {justif.student?.name?.charAt(0) || 'E'}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                                        {justif.student?.name} {justif.student?.paternal_surname}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                        {justif.student?.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                background: '#dcfce7', color: '#166534',
                                                padding: '4px 10px', borderRadius: '12px',
                                                fontSize: '11px', fontWeight: '700'
                                            }}>
                                                APROBADO
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>
                                                Motivo
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {justif.absence_reason}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                                            <div>
                                                <span style={{ display: 'block', fontWeight: '600', color: '#475569', marginBottom: '2px' }}>Desde</span>
                                                {new Date(justif.absence_start_date).toLocaleDateString()}
                                            </div>
                                            <div style={{ width: '1px', background: '#cbd5e1' }}></div>
                                            <div>
                                                <span style={{ display: 'block', fontWeight: '600', color: '#475569', marginBottom: '2px' }}>Hasta</span>
                                                {new Date(justif.absence_end_date).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedJustification(justif);
                                                setShowJustificationModal(true);
                                                // Optional: Mark as viewed logic here if needed
                                            }}
                                            style={{
                                                width: '100%', padding: '12px', borderRadius: '14px',
                                                border: 'none', background: '#8b5cf6', color: 'white',
                                                fontWeight: '600', cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
                                                transition: 'transform 0.2s'
                                            }}
                                        >
                                            Ver Detalles Completos
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* RAMOS VIEW */
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Mis Ramos</h3>
                        </div>

                        {/* Course List Placeholder - Will be populated with API data */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                            {courses.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No tienes ramos asignados aún.
                                </div>
                            ) : (
                                courses.map((course: any) => (
                                    <div key={course.id} style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{course.semester}</span>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>Code: {course.code}</span>
                                        </div>
                                        <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{course.name}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                                            <span>👥 {course.student_count || 0} Estudiantes</span>
                                        </div>
                                        <button
                                            onClick={() => handleViewStudents(course.id, course.name)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Ver Alumnos
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ marginTop: '40px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                            <p>La carga de cursos y estudiantes es gestionada por Coordinación.</p>
                        </div>
                    </div>
                )}
            </main>

            {/* MODALS */}
            {/* Student List Modal */}
            {showStudentModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '600px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                                Estudiantes - {selectedCourseName}
                            </h2>
                            <button onClick={() => setShowStudentModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
                            {selectedCourseStudents.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No hay estudiantes inscritos en este curso.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedCourseStudents.map(student => (
                                        <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{student.name}</div>
                                                <div style={{ fontSize: '13px', color: '#64748b' }}>{student.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'right' }}>
                            <button onClick={() => setShowStudentModal(false)} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Accept Modal */}
            {
                showAcceptModal && selectedTicket && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '450px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Aceptar Solicitud</h2>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Fecha y Hora Confirmada</label>
                                <input
                                    type="datetime-local"
                                    value={confirmedDate}
                                    onChange={e => setConfirmedDate(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowAcceptModal(false)} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleAccept} disabled={!confirmedDate || actionLoading} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                    {actionLoading ? 'Procesando...' : 'Confirmar Cita'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reject Modal */}
            {
                showRejectModal && selectedTicket && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '450px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Rechazar Solicitud</h2>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Motivo de rechazo</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="Indica al estudiante por qué no puedes atender su solicitud..."
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', minHeight: '100px', resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowRejectModal(false)} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleReject} disabled={!rejectReason || actionLoading} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                    {actionLoading ? 'Procesando...' : 'Rechazar Ticket'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Respond Modal */}
            {
                showRespondModal && selectedTicket && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '90%', maxWidth: '500px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Responder al Estudiante</h2>
                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Ticket: {selectedTicket.ticket_code}</p>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Tu Respuesta</label>
                                <textarea
                                    value={respondMessage}
                                    onChange={e => setRespondMessage(e.target.value)}
                                    placeholder="Escribe tu respuesta para el estudiante..."
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: '16px',
                                        border: '1px solid #e2e8f0', background: '#f8fafc',
                                        fontSize: '14px', minHeight: '150px', resize: 'vertical',
                                        lineHeight: '1.5', outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowRespondModal(false)}
                                    style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAcademicRespond}
                                    disabled={!respondMessage.trim() || actionLoading}
                                    style={{
                                        padding: '12px 24px', borderRadius: '16px', border: 'none',
                                        background: respondMessage.trim() ? '#4f46e5' : '#cbd5e1',
                                        color: 'white', fontWeight: '600', cursor: respondMessage.trim() ? 'pointer' : 'not-allowed',
                                        boxShadow: respondMessage.trim() ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none'
                                    }}
                                >
                                    {actionLoading ? 'Enviando...' : 'Enviar Respuesta'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CHAT MODAL */}
            {showChatModal && chatTicket && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        width: '95%',
                        maxWidth: '700px',
                        height: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        {/* Chat Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            padding: '20px 24px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                                    {chatTicket.title}
                                </h2>
                                <p style={{ fontSize: '13px', opacity: 0.9 }}>
                                    Ticket #{chatTicket.ticket_code} • 🎓 {chatTicket.student_name}
                                </p>
                            </div>
                            <button
                                onClick={closeChat}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    cursor: 'pointer',
                                    color: 'white',
                                    fontSize: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            background: '#f8fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            {loadingMessages ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                                    Cargando mensajes...
                                </div>
                            ) : (
                                <>
                                    {/* Initial ticket description as first "message" from student */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            flexShrink: 0,
                                            overflow: 'hidden'
                                        }}>
                                            {chatTicket.student_profile_photo ? (
                                                <img src={chatTicket.student_profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                chatTicket.student_name?.charAt(0) || 'E'
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                background: '#dcfce7',
                                                padding: '14px 18px',
                                                borderRadius: '18px 18px 18px 4px',
                                                maxWidth: '85%'
                                            }}>
                                                <p style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.5' }}>
                                                    {chatTicket.description}
                                                </p>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', marginLeft: '4px' }}>
                                                {chatTicket.student_name} • {new Date(chatTicket.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legacy coordinator/academic response - only show if no chat messages exist */}
                                    {chatTicket.coordinator_response && chatMessages.length === 0 && (
                                        <div style={{ display: 'flex', gap: '12px', flexDirection: 'row-reverse' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: chatTicket.escalated_to_academic
                                                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '14px',
                                                flexShrink: 0
                                            }}>
                                                {chatTicket.escalated_to_academic ? 'A' : 'C'}
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <div style={{
                                                    background: chatTicket.escalated_to_academic
                                                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                    padding: '14px 18px',
                                                    borderRadius: '18px 18px 4px 18px',
                                                    maxWidth: '85%',
                                                    color: 'white'
                                                }}>
                                                    <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                        {chatTicket.coordinator_response}
                                                    </p>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', marginRight: '4px' }}>
                                                    {chatTicket.escalated_to_academic
                                                        ? `📚 ${chatTicket.academic_name || user?.name || 'Académico'}`
                                                        : `👤 ${chatTicket.coordinator_name || 'Coordinador'}`} • {chatTicket.responded_at ? new Date(chatTicket.responded_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Chat Messages */}
                                    {chatMessages.map(msg => {
                                        const isStudent = msg.sender_role === 'estudiante';
                                        const isCoordinator = msg.sender_role === 'coordinador';
                                        const isAcademic = msg.sender_role === 'academico';

                                        // Get avatar color based on role
                                        const avatarGradient = isStudent
                                            ? 'linear-gradient(135deg, #10b981, #059669)'
                                            : isCoordinator
                                                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                                : 'linear-gradient(135deg, #f59e0b, #d97706)';

                                        const bubbleStyle = isStudent
                                            ? { background: '#dcfce7', color: '#1e293b' }
                                            : isCoordinator
                                                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
                                                : { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' };

                                        // Determine if message is from current user (academic)
                                        const isCurrentUser = isAcademic;

                                        // System messages
                                        if (msg.is_system_message) {
                                            return (
                                                <div key={msg.id} style={{ textAlign: 'center', padding: '8px' }}>
                                                    <span style={{
                                                        background: '#e0e7ff',
                                                        color: '#4f46e5',
                                                        padding: '6px 16px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        ℹ️ {msg.content}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={msg.id} style={{
                                                display: 'flex',
                                                gap: '12px',
                                                flexDirection: isCurrentUser ? 'row-reverse' : 'row'
                                            }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: avatarGradient,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '14px',
                                                    flexShrink: 0,
                                                    overflow: 'hidden'
                                                }}>
                                                    {msg.sender_photo ? (
                                                        <img src={msg.sender_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        msg.sender_name?.charAt(0) || (isStudent ? 'E' : isCoordinator ? 'C' : 'A')
                                                    )}
                                                </div>
                                                <div style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
                                                }}>
                                                    <div style={{
                                                        ...bubbleStyle,
                                                        padding: '14px 18px',
                                                        borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                        maxWidth: '85%'
                                                    }}>
                                                        <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#94a3b8',
                                                        marginTop: '4px',
                                                        marginLeft: isCurrentUser ? '0' : '4px',
                                                        marginRight: isCurrentUser ? '4px' : '0'
                                                    }}>
                                                        {isCurrentUser
                                                            ? `📚 ${user?.name || 'Tú'}`
                                                            : (isStudent
                                                                ? msg.sender_name || 'Estudiante'
                                                                : isCoordinator
                                                                    ? `👤 ${msg.sender_name || 'Coordinador'}`
                                                                    : `📚 ${msg.sender_name || 'Académico'}`)} • {new Date(msg.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {chatMessages.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                            <p style={{ fontSize: '14px' }}>No hay más mensajes en este ticket.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Chat Input */}
                        <div style={{
                            padding: '16px 20px',
                            background: 'white',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={handleChatKeyDown}
                                placeholder="Escribe un mensaje..."
                                rows={1}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    borderRadius: '24px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    fontSize: '14px',
                                    outline: 'none',
                                    resize: 'none',
                                    overflowY: 'hidden',
                                    minHeight: '48px',
                                    maxHeight: '150px',
                                    fontFamily: 'inherit',
                                    lineHeight: '1.5'
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={sendingMessage || !newMessage.trim()}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: sendingMessage || !newMessage.trim()
                                        ? '#cbd5e1'
                                        : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: 'white',
                                    cursor: sendingMessage || !newMessage.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    flexShrink: 0
                                }}
                            >
                                {sendingMessage ? '...' : '➤'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Justification Details Modal */}
            {showJustificationModal && selectedJustification && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{
                        background: 'white', borderRadius: '30px', width: '90%', maxWidth: '600px',
                        padding: '0', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Detalle de Justificativo</h2>
                                <p style={{ fontSize: '13px', color: '#64748b' }}>ID: #{selectedJustification.id}</p>
                            </div>
                            <button onClick={() => setShowJustificationModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ padding: '32px', overflowY: 'auto' }}>
                            {/* Student Info Card */}
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', padding: '20px', background: '#eff6ff', borderRadius: '20px', border: '1px solid #dbeafe' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%', background: 'white',
                                    color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '24px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                                }}>
                                    {selectedJustification.student?.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a8a', marginBottom: '4px' }}>
                                        {selectedJustification.student?.name} {selectedJustification.student?.paternal_surname} {selectedJustification.student?.maternal_surname}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px', color: '#1e40af' }}>
                                        <div>📧 {selectedJustification.student?.email}</div>
                                        <div>🆔 RUT: {selectedJustification.student?.rut}</div>
                                        <div>🎓 Ingreso: {selectedJustification.student?.admission_year}</div>
                                        <div>📱 {selectedJustification.student?.phone || 'Sin teléfono'}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                        Profesor que revisa
                                    </label>
                                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600' }}>
                                        {user ? `${user.name} ${user.paternal_surname || ''}` : 'Tú'}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                        Estado
                                    </label>
                                    <div style={{
                                        padding: '12px 16px', borderRadius: '12px',
                                        background: '#dcfce7', color: '#166534', fontWeight: '700',
                                        display: 'inline-block', border: '1px solid #bbf7d0'
                                    }}>
                                        ✅ APROBADO
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '16px', background: '#e0e7ff', borderRadius: '16px', color: '#3730a3', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid #c7d2fe' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                    Recuerda registrar la asistencia en el ramo correspondiente para las fechas indicadas.
                                </span>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Ramos Afectados
                                </label>
                                <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '16px', border: '1px solid #fef3c7', color: '#92400e', lineHeight: '1.6' }}>
                                    {selectedJustification.affected_courses}
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Fechas de Ausencia
                                </label>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Inicio</div>
                                        <div style={{ fontWeight: '600', color: '#334155' }}>{new Date(selectedJustification.absence_start_date).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Fin</div>
                                        <div style={{ fontWeight: '600', color: '#334155' }}>{new Date(selectedJustification.absence_end_date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Motivo Detallado
                                </label>
                                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: '1.6' }}>
                                    {selectedJustification.absence_reason}
                                </div>
                            </div>

                            {/* Documents Section if needed */}
                            {selectedJustification.document_path && (
                                <div style={{ marginTop: '24px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                        Documentos Adjuntos
                                    </label>
                                    <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>📎</span> Documento disponible (Gestionado por Coordinación)
                                    </div>
                                </div>
                            )}

                        </div>

                        <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                            <button
                                onClick={() => setShowJustificationModal(false)}
                                style={{
                                    padding: '12px 24px', borderRadius: '14px', border: 'none',
                                    background: '#1e293b', color: 'white', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
