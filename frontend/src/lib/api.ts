import { authService, User } from '../services/auth.service';
import { ticketService, Ticket, TicketMessage } from '../services/ticket.service';
import { statsService, Stats, CoordinatorStats, AdminStats, AcademicAnalytics } from '../services/stats.service';
import { academicService, Academic, Course, AssignStudentRequest } from '../services/academic.service';
import { justificationService, Justification } from '../services/justification.service';

// Export interfaces
export type { User } from '../services/auth.service';
export type { Ticket, TicketMessage } from '../services/ticket.service';
export type { Stats, CoordinatorStats, AdminStats, AcademicAnalytics } from '../services/stats.service';
export type { Academic, Course, AssignStudentRequest } from '../services/academic.service';
export type { Justification } from '../services/justification.service';

// Auth Wrappers
export const login = authService.login;
export const register = authService.register;
export const getUsers = authService.getUsers;
export const updateProfile = authService.updateProfile;
export const uploadAvatar = authService.uploadAvatar;
export const createUser = authService.createUser;
export const deleteUser = authService.deleteUser;
export const resetUserPassword = async (userId: number, newPassword: string) => {
    // Implement here or add to authService if missing
    // It was missing in my previous authService implementation, checking...
    // I need to add it to authService or implement standard fetch here but better to add to service.
    // implementing directly here for now to match interface, but ideally should be in service
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/auth/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
    });
};
export const changePassword = async (data: any) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};
export const onboardingChangePassword = async (userId: number, newPassword: string) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/auth/users/${userId}/onboarding-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
    });
};
export const updateUser = async (userId: number, data: any) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/auth/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

// Ticket Wrappers
export const createTicket = ticketService.create;
export const getStudentTickets = ticketService.getByStudent;
export const getAcademicTickets = ticketService.getByAcademic;
export const getAllTickets = ticketService.getAll;
export const respondTicket = ticketService.respond;
export const resolveTicket = ticketService.resolve;
export const getTicketMessages = ticketService.getMessages;
export const sendTicketMessage = ticketService.sendMessage;

export const acceptTicket = async (ticketId: number, confirmedDate: string) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/tickets/${ticketId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_date: confirmedDate }),
    });
};
export const rejectTicket = async (ticketId: number, reason: string) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/tickets/${ticketId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
    });
};
export const completeTicket = async (ticketId: number) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/tickets/${ticketId}/complete`, {
        method: 'PUT',
    });
};
export const reopenTicket = async (ticketId: number, reason: string) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/tickets/${ticketId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
};
export const escalateTicket = async (ticketId: number, academicId: number, note: string, coordinatorId: number) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/tickets/${ticketId}/escalate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academic_id: academicId, note, coordinator_id: coordinatorId }),
    });
};
export const academicRespondTicket = async (ticketId: number, response: string, academicId: number) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/tickets/${ticketId}/academic-respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, coordinator_id: academicId }),
    });
};
export const deleteTicket = async (ticketId: number, hard: boolean = false) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/tickets/${ticketId}${hard ? '?hard=true' : ''}`, {
        method: 'DELETE',
    });
};
export const archiveTicket = async (ticketId: number) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    return fetchJson(`${API_BASE}/tickets/${ticketId}/archive`, {
        method: 'PUT',
    });
};
export const filterTickets = async (params: any) => {
    const { API_BASE, fetchJson } = await import('../services/api.client');
    const searchParams = new URLSearchParams();
    if (params.year) searchParams.append('year', params.year);
    if (params.ticket_type) searchParams.append('ticket_type', params.ticket_type);
    if (params.status) searchParams.append('status', params.status);
    return fetchJson(`${API_BASE}/tickets/filter?${searchParams}`);
};

// Stats Wrappers
export const getAcademicStats = statsService.getAcademicStats;
export const getCoordinatorStats = statsService.getCoordinatorStats;
export const getAdminAnalytics = statsService.getAdminAnalytics;
export const getCoordinatorAnalytics = statsService.getCoordinatorAnalytics;
export const getAcademicAnalytics = statsService.getAcademicAnalytics;
export const getAdminStats = statsService.getAdminStats;

// Academic Wrappers
export const getAcademics = academicService.getAcademics;
export const getAcademicCourses = academicService.getCourses;
export const getCourseStudents = academicService.getCourseStudents;
export const createCourse = academicService.createCourse;
export const assignStudentToCourse = academicService.assignStudentToCourse;

// Justification Wrappers
// Justification Wrappers
export const createJustification = justificationService.create;
export const getStudentJustifications = async (studentId: number) => {
    return justificationService.getByStudent(studentId);
}
export const getPendingJustifications = async (coordinatorEmail: string) => {
    return justificationService.getPending(coordinatorEmail);
}
export const approveJustification = justificationService.approve;
export const rejectJustification = justificationService.reject;
export const getProfessorJustifications = async (professorId: number) => {
    return justificationService.getByProfessor(professorId);
}

export const markViewedJustification = async (professorId: number, justificationId: number) => {
    return justificationService.markViewed(professorId, justificationId);
}
export const updateJustificationProfessors = justificationService.updateProfessors;



// Notification Service
import { notificationService, Notification } from '../services/notification.service';
export type { Notification } from '../services/notification.service';
export const getNotifications = notificationService.getNotifications;
export const markNotificationAsRead = notificationService.markAsRead;
