import { API_BASE, fetchJson } from './api.client';

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    is_read: boolean;
    type: string;
    related_id?: number;
    created_at: string;
}

export const notificationService = {
    getNotifications: async (userId: number): Promise<Notification[]> => { // Changed return type to Notification[]
        return fetchJson(`${API_BASE}/notifications/user/${userId}`);
    },

    markAsRead: async (notificationId: number): Promise<Notification> => {
        return fetchJson(`${API_BASE}/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }
};
