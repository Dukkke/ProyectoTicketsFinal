// src/types/user.types.ts
// Tipos relacionados con usuarios

export type UserRole =
    | 'estudiante'
    | 'estudiante-remoto'
    | 'academico'
    | 'coordinador'
    | 'admin';

export interface User {
    id: string;
    email: string;
    nombre: string;
    apellido?: string;
    rut?: string;
    role: UserRole;
    carrera?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    nombre: string;
    apellido: string;
    email: string;
    rut: string;
    password: string;
    carrera?: string;
}
