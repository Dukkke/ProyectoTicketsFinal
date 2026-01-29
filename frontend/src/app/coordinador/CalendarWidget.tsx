import { useState } from 'react';
import { Ticket } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
        if (isSelected(day)) {
            onDateSelect(null);
        } else {
            onDateSelect(clickedDate.toISOString());
        }
    };

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: '40px' }}></div>);
        }
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
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)', height: 'fit-content'
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
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{t.ticket_code}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(t.proposed_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                    ))}
                {tickets.filter(t => t.status === 'aceptado' || t.status === 'pendiente').length === 0 && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '10px' }}>
                        No hay eventos próximos
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarWidget;
