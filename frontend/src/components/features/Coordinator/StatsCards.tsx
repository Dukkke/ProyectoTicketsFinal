import { Ticket } from '@/lib/api';
import { BarChart, Clock, Flame, CheckCircle, FileText, XCircle, CheckSquare } from 'lucide-react';

interface StatsCardsProps {
    weeklyTickets?: Ticket[];
    justifications?: any[];
    statusFilter?: 'all' | 'pending' | 'responded' | 'solved';
    setStatusFilter?: (filter: 'all' | 'pending' | 'responded' | 'solved') => void;
    mode?: 'tickets' | 'justifications';
}

export function StatsCards({ weeklyTickets = [], justifications = [], statusFilter, setStatusFilter, mode = 'tickets' }: StatsCardsProps) {
    let stats = [];

    if (mode === 'justifications') {
        stats = [
            { label: 'Total', value: justifications.length, color: '#64748b', bg: '#f1f5f9', icon: <FileText size={20} />, filter: 'all' },
            { label: 'Pendientes', value: justifications.filter(j => j.status === 'PENDIENTE').length, color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={20} />, filter: 'pending' },
            { label: 'Aprobados', value: justifications.filter(j => j.status === 'APROBADO').length, color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle size={20} />, filter: 'approved' },
            { label: 'Rechazados', value: justifications.filter(j => j.status === 'RECHAZADO').length, color: '#ef4444', bg: '#fee2e2', icon: <XCircle size={20} />, filter: 'rejected' },
        ];
    } else {
        stats = [
            { label: 'Total Semana', value: weeklyTickets.length, color: '#64748b', bg: '#f1f5f9', icon: <BarChart size={20} />, filter: 'all' },
            { label: 'Pendientes', value: weeklyTickets.filter(t => t.status === 'pendiente').length, color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={20} />, filter: 'pending' },
            { label: 'En Gestión', value: weeklyTickets.filter(t => ['derivado', 'respondido', 'aceptado'].includes(t.status)).length, color: '#3b82f6', bg: '#eff6ff', icon: <Flame size={20} />, filter: 'responded' },
            { label: 'Finalizados', value: weeklyTickets.filter(t => ['solucionado', 'completado', 'rechazado'].includes(t.status)).length, color: '#10b981', bg: '#f0fdf4', icon: <CheckSquare size={20} />, filter: 'solved' },
        ];
    }

    return (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {stats.map((stat, idx) => (
                <div key={idx}
                    onClick={() => setStatusFilter && stat.filter !== 'all' && setStatusFilter(stat.filter as any)}
                    style={{
                        background: 'white', padding: '12px 16px', borderRadius: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        transition: 'all 0.2s',
                        cursor: stat.filter !== 'all' ? 'pointer' : 'default',
                        border: statusFilter === stat.filter && stat.filter !== 'all' ? `2px solid ${stat.color}` : '2px solid transparent',
                        transform: statusFilter === stat.filter && stat.filter !== 'all' ? 'translateY(-2px)' : 'translateY(0)',
                        minWidth: '130px'
                    }}
                >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                        {stat.icon}
                    </div>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', lineHeight: 1 }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>{stat.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
