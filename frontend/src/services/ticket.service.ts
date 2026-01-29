import { API_BASE, fetchJson } from './api.client';

export interface Ticket {
    id: number;
    ticket_code: string;
    student_id: number;
    academic_id: number;
    ticket_type: string;
    status: string;
    title: string;
    description: string;
    proposed_date: string;
    confirmed_date?: string;
    created_at: string;
    updated_at: string;
    rejection_reason?: string;
    student_name?: string;
    academic_name?: string;
    coordinator_name?: string;
    student_year?: string;
    student_rut?: string;
    student_profile_photo?: string;
    coordinator_response?: string;
    responded_at?: string;
    satisfaction_rating?: number;
    satisfaction_comment?: string;
    resolved_at?: string;
    escalated_to_academic?: boolean;
    escalation_note?: string;
    student_email?: string;
    student_modality?: string;
    student_admission_year?: number;
    reopen_count?: number;
    coordinator_id?: number;
    is_archived?: boolean;
    is_deleted?: boolean;
}

export interface TicketMessage {
    id: number;
    ticket_id: number;
    sender_id: number;
    sender_role: 'estudiante' | 'coordinador' | 'academico';
    sender_name?: string;
    sender_photo?: string;
    content: string;
    created_at: string;
    is_system_message: boolean;
}

export const ticketService = {
    async create(studentId: number, data: any): Promise<Ticket> {
        return fetchJson(`${API_BASE}/tickets?student_id=${studentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    async getByStudent(studentId: number, archived = false): Promise<Ticket[]> {
        return fetchJson(`${API_BASE}/tickets/student/${studentId}?archived=${archived}`);
    },

    async getByAcademic(academicId: number): Promise<Ticket[]> {
        return fetchJson(`${API_BASE}/tickets/academic/${academicId}`);
    },

    async getAll(coordinatorEmail?: string): Promise<Ticket[]> {
        const url = coordinatorEmail
            ? `${API_BASE}/tickets?coordinator_email=${encodeURIComponent(coordinatorEmail)}`
            : `${API_BASE}/tickets`;
        return fetchJson(url);
    },

    async respond(ticketId: number, response: string, coordinatorId: number): Promise<Ticket> {
        return fetchJson(`${API_BASE}/tickets/${ticketId}/respond`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response, coordinator_id: coordinatorId }),
        });
    },

    async resolve(ticketId: number, rating: number, comment?: string): Promise<Ticket> {
        let url = `${API_BASE}/tickets/${ticketId}/resolve?rating=${rating}`;
        if (comment) url += `&comment=${encodeURIComponent(comment)}`;
        return fetchJson(url, { method: 'PUT' });
    },

    async getMessages(ticketId: number): Promise<TicketMessage[]> {
        return fetchJson(`${API_BASE}/tickets/${ticketId}/messages`);
    },

    async sendMessage(ticketId: number, content: string, senderId: number, senderRole: string): Promise<TicketMessage> {
        return fetchJson(
            `${API_BASE}/tickets/${ticketId}/messages?sender_id=${senderId}&sender_role=${senderRole}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            }
        );
    },

    async reopenTicket(ticketId: number, reason: string): Promise<Ticket> {
        return fetchJson(`${API_BASE}/tickets/${ticketId}/reopen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
        });
    }
};
