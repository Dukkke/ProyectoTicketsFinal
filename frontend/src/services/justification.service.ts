import { API_BASE, fetchJson } from './api.client';

export interface Justification {
    id: number;
    student_id: number;
    absence_reason: string;
    absence_start_date: string;
    absence_end_date: string;
    affected_courses: string;
    document_filename: string;
    status: 'pendiente' | 'aprobado' | 'rechazado';
    created_at: string;
    reviewed_at?: string;
    rejection_reason?: string;
    coordinator_id?: number;
    student?: {
        name: string;
        paternal_surname: string;
        maternal_surname: string;
        rut: string;
        admission_year?: number;
    };
    professor_ids?: number[];
}

export interface CreateJustificationData {
    student_id: number;
    absence_reason: string;
    absence_start_date: string;
    absence_end_date: string;
    affected_courses: string;
    professor_ids: number[];
    documents: File[];
}

export const justificationService = {
    async create(data: CreateJustificationData): Promise<Justification> {
        const formData = new FormData();
        formData.append('student_id', data.student_id.toString());
        formData.append('absence_reason', data.absence_reason);
        formData.append('absence_start_date', data.absence_start_date);
        formData.append('absence_end_date', data.absence_end_date);
        formData.append('affected_courses', data.affected_courses);
        formData.append('professor_ids', data.professor_ids.join(','));
        if (data.documents && data.documents.length > 0) {
            data.documents.forEach(file => {
                formData.append('documents', file);
            });
        }

        const response = await fetch(`${API_BASE}/justifications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al crear justificativo');
        }

        return response.json();
    },

    async getByStudent(studentId: number): Promise<{ items: Justification[], total: number }> {
        return fetchJson(`${API_BASE}/justifications/student/${studentId}`);
    },

    async getPending(coordinatorEmail: string): Promise<{ items: Justification[], total: number }> {
        return fetchJson(`${API_BASE}/justifications/pending?coordinator_email=${encodeURIComponent(coordinatorEmail)}`);
    },

    async approve(justificationId: number, coordinatorId: number): Promise<void> {
        return fetchJson(`${API_BASE}/justifications/${justificationId}/approve?coordinator_id=${coordinatorId}`, {
            method: 'PUT'
        });
    },

    async reject(justificationId: number, coordinatorId: number, reason: string): Promise<void> {
        return fetchJson(`${API_BASE}/justifications/${justificationId}/reject?coordinator_id=${coordinatorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rejection_reason: reason })
        });
    },

    async getByProfessor(professorId: number): Promise<{ items: Justification[], total: number }> {
        return fetchJson(`${API_BASE}/justifications/professor/${professorId}`);
    },

    async markViewed(professorId: number, justificationId: number): Promise<void> {
        return fetchJson(`${API_BASE}/justifications/professor/${professorId}/view/${justificationId}`, {
            method: 'PUT'
        });
    },

    getDocumentUrl(filename: string): string {
        return `${API_BASE}/justifications/document/${filename}`;
    },

    async updateProfessors(justificationId: number, professorIds: number[]): Promise<void> {
        return fetchJson(`${API_BASE}/justifications/${justificationId}/professors`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ professor_ids: professorIds })
        });
    }
};
