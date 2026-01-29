import { API_BASE, fetchJson } from './api.client';

export interface Stats {
    total_tickets: number;
    pending: number;
    accepted: number;
    responded: number;
    completed: number;
    rejected: number;
    unique_students?: number;
    completion_rate?: number;
}

export interface CoordinatorStats {
    total_tickets: number;
    pending: number;
    responded: number;
    solved: number;
    escalated: number;
    completed: number;
    students_by_year: Record<string, number>;
    pending_by_type: Record<string, number>;
    avg_satisfaction: number;
}

export interface AdminStats {
    total_tickets: number;
    total_users: number;
    status_counts: Record<string, number>;
    role_counts: Record<string, number>;
    avg_satisfaction: number;
    rating_distribution: Record<number, number>;
    escalation_rate: number;
    resolution_rate: number;
}

export interface AcademicAnalytics {
    id: number;
    name: string;
    tickets_assigned: number;
    tickets_resolved: number;
    resolution_rate: number;
    avg_rating: number;
    avg_response_hours: number;
    current_backlog: number;
}

export const statsService = {
    async getAcademicStats(academicId: number): Promise<Stats> {
        return fetchJson(`${API_BASE}/stats/academic/${academicId}`);
    },

    async getCoordinatorStats(): Promise<CoordinatorStats> {
        return fetchJson(`${API_BASE}/stats/coordinator`);
    },

    async getAdminAnalytics(): Promise<any> {
        return fetchJson(`${API_BASE}/stats/admin/analytics`);
    },

    async getCoordinatorAnalytics(): Promise<any[]> {
        return fetchJson(`${API_BASE}/stats/admin/coordinators`);
    },

    async getAcademicAnalytics(): Promise<AcademicAnalytics[]> {
        return fetchJson(`${API_BASE}/stats/admin/academics`);
    },

    async getAdminStats(): Promise<AdminStats> {
        return fetchJson(`${API_BASE}/stats/admin`);
    }
};
