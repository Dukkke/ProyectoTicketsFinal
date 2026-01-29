// src/security/validation.ts
import { z } from 'zod';

// Validador de RUT chileno
const rutRegex = /^\d{7,8}-[\dkK]$/;

// Esquema de validación para tickets
export const ticketSchema = z.object({
    titulo: z.string()
        .min(5, 'El título debe tener al menos 5 caracteres')
        .max(200, 'El título no puede exceder 200 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,!?¿¡()-]+$/, 'Caracteres no permitidos en el título'),

    descripcion: z.string()
        .min(20, 'La descripción debe tener al menos 20 caracteres')
        .max(2000, 'La descripción no puede exceder 2000 caracteres'),

    categoria: z.enum(['academico', 'administrativo', 'tecnico', 'otro'], {
        message: 'Selecciona una categoría válida'
    }),
});

// Esquema de validación para login
export const loginSchema = z.object({
    email: z.string()
        .email('Email inválido')
        .refine(
            (email) => email.endsWith('@uahurtado.cl') || email.endsWith('@alumnos.uahurtado.cl'),
            'Debe usar correo institucional (@uahurtado.cl o @alumnos.uahurtado.cl)'
        ),

    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Esquema de validación para registro de estudiantes
export const registerSchema = z.object({
    nombre: z.string()
        .min(2, 'Nombre muy corto')
        .max(50, 'Nombre muy largo')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras'),

    apellido: z.string()
        .min(2, 'Apellido muy corto')
        .max(50, 'Apellido muy largo')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El apellido solo puede contener letras'),

    rut: z.string()
        .regex(rutRegex, 'Formato RUT inválido (ej: 12345678-9)'),

    email: z.string()
        .email('Email inválido')
        .refine(
            (email) => email.endsWith('@alumnos.uahurtado.cl'),
            'Estudiantes deben usar correo @alumnos.uahurtado.cl'
        ),

    password: z.string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número')
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Debe contener un carácter especial'),

    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

// Esquema para cambio de contraseña
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),

    newPassword: z.string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número')
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Debe contener un carácter especial'),

    confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
});

// Esquema para mensajes de chat
export const chatMessageSchema = z.object({
    contenido: z.string()
        .min(1, 'El mensaje no puede estar vacío')
        .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
});

// Tipos inferidos de los esquemas
export type TicketInput = z.infer<typeof ticketSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

/**
 * Función helper para validar datos contra un esquema
 */
export const validate = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map((e: { message: string }) => e.message)
    };
};

/**
 * Hook-friendly validation que retorna el primer error
 */
export const validateField = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
): string | null => {
    const result = schema.safeParse(data);
    if (result.success) return null;
    return result.error.issues[0]?.message || 'Error de validación';
};
