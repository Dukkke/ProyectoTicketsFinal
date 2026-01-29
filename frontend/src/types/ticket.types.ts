// src/types/ticket.types.ts
// Tipos relacionados con tickets

export type TicketStatus =
    | 'abierto'
    | 'en_progreso'
    | 'respondido'
    | 'cerrado'
    | 'reabierto';

export type TicketCategory =
    | 'academico'
    | 'administrativo'
    | 'tecnico'
    | 'otro';

export type TicketPriority =
    | 'baja'
    | 'media'
    | 'alta'
    | 'urgente';

export interface Ticket {
    id: string;
    titulo: string;
    descripcion: string;
    categoria: TicketCategory;
    estado: TicketStatus;
    prioridad?: TicketPriority;
    estudianteId: string;
    estudianteNombre?: string;
    estudianteEmail?: string;
    coordinadorId?: string;
    academicoId?: string;
    calificacion?: number;
    createdAt: string;
    updatedAt?: string;
    closedAt?: string;
}

export interface TicketMessage {
    id: string;
    ticketId: string;
    contenido: string;
    autorId: string;
    autorNombre: string;
    autorRole: string;
    createdAt: string;
}

export interface CreateTicketData {
    titulo: string;
    descripcion: string;
    categoria: TicketCategory;
}

export interface TicketFilters {
    estado?: TicketStatus;
    categoria?: TicketCategory;
    search?: string;
    page?: number;
    limit?: number;
}

export interface TicketStats {
    total: number;
    abiertos: number;
    enProgreso: number;
    cerrados: number;
    promedioCalificacion?: number;
}
