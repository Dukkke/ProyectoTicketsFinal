'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { getNotifications, markNotificationAsRead, Notification } from '@/lib/api';

interface NotificationBellProps {
    userId: number;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadNotifications = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const data = await getNotifications(userId);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await markNotificationAsRead(id);
            // Update local state instead of full reload for smoother UX
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                    position: 'relative', background: 'white', border: 'none',
                    padding: '10px', borderRadius: '12px', cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -5, right: -5,
                        background: '#ef4444', color: 'white',
                        fontSize: '10px', fontWeight: 'bold',
                        width: '18px', height: '18px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 0 2px white'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                        onClick={() => setShowNotifications(false)}
                    />
                    <div style={{
                        position: 'absolute', top: '120%', right: 0,
                        width: '320px', background: 'white', borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 100,
                        border: '1px solid #f1f5f9'
                    }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b' }}>
                            <span style={{ fontSize: '15px' }}>Notificaciones</span>
                            <button
                                onClick={loadNotifications}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: loading ? '#94a3b8' : '#6366f1' }}
                                title="Actualizar"
                                disabled={loading}
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔕</div>
                                    <p style={{ margin: 0 }}>No tienes notificaciones por ahora.</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} style={{
                                        padding: '16px', borderBottom: '1px solid #f1f5f9',
                                        background: n.is_read ? 'white' : 'rgba(99, 102, 241, 0.03)',
                                        transition: 'background 0.2s',
                                        position: 'relative'
                                    }}>
                                        {!n.is_read && (
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#6366f1' }} />
                                        )}
                                        <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: '#1e293b' }}>{n.title}</div>
                                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0', lineHeight: '1.5' }}>{n.message}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                🕒 {new Date(n.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {!n.is_read && (
                                                <button
                                                    style={{ fontSize: '11px', color: '#6366f1', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: '700' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(n.id);
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
                        {notifications.length > 0 && (
                            <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                <button
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))} // Just local visual
                                >
                                    Ver todas las notificaciones
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
