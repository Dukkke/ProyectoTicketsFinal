import { API_BASE, fetchJson } from './api.client';
import { User } from './auth.service';

export interface Academic {
    id: number;
    name: string;
    email: string;
    modality?: string;
}

export interface Course {
    id: number;
    name: string;
    code: string;
    academic_id: number;
    semester: string;
    student_count: number;
}

export interface AssignStudentRequest {
    student_email: string;
}

export const academicService = {
    async getAcademics(): Promise<Academic[]> {
        return fetchJson(`${API_BASE}/academics`);
    },

    async getCourses(academicId: number): Promise<Course[]> {
        return fetchJson(`${API_BASE}/courses/academic/${academicId}`);
    },

    async getCourseStudents(courseId: number): Promise<User[]> {
        return fetchJson(`${API_BASE}/courses/${courseId}/students`);
    },

    async createCourse(data: { name: string; code: string; semester: string }, academicId: number): Promise<Course> {
        return fetchJson(`${API_BASE}/courses?academic_id=${academicId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async assignStudentToCourse(courseId: number, data: AssignStudentRequest): Promise<void> {
        // This endpoint might need specific error handling if the API returns 400 with details
        const res = await fetch(`${API_BASE}/courses/${courseId}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            let errorMsg = 'Error al asignar estudiante';
            try {
                const text = await res.text();
                const error = JSON.parse(text);
                errorMsg = error.detail || errorMsg;
            } catch { }
            throw new Error(errorMsg);
        }
    }
};
