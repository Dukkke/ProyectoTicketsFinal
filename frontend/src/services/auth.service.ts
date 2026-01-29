import { API_BASE, fetchJson } from './api.client';

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    created_at: string;
    year?: string;
    rut?: string;
    profile_photo?: string;
    phone?: string;
    office?: string;
    bio?: string;
    must_change_password?: boolean;
    paternal_surname?: string;
    maternal_surname?: string;
    personal_email?: string;
    emergency_phone?: string;
    admission_year?: number;
    program?: string;
    modality?: string;
}

export const authService = {
    async login(email: string, password: string): Promise<User> {
        return fetchJson(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
    },

    async register(data: any): Promise<User> {
        return fetchJson(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    async getUsers(coordinatorEmail?: string): Promise<User[]> {
        const url = coordinatorEmail
            ? `${API_BASE}/auth/users?coordinator_email=${encodeURIComponent(coordinatorEmail)}`
            : `${API_BASE}/auth/users`;
        return fetchJson(url);
    },

    async updateProfile(userId: number, data: any): Promise<User> {
        return fetchJson(`${API_BASE}/users/${userId}/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    async uploadAvatar(userId: number, file: File): Promise<{ profile_photo: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/users/${userId}/upload-avatar`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Error al subir imagen');
        return res.json();
    },

    async createUser(data: any): Promise<User> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (data.requestingRole) headers['X-Requesting-Role'] = data.requestingRole;
        if (data.requestingEmail) headers['X-Requesting-Email'] = data.requestingEmail;

        return fetchJson(`${API_BASE}/auth/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
    },

    async deleteUser(userId: number, requestingRole?: string): Promise<void> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (requestingRole) headers['X-Requesting-Role'] = requestingRole;

        await fetch(`${API_BASE}/auth/users/${userId}`, {
            method: 'DELETE',
            headers,
        });
    }
};
