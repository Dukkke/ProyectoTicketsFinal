// src/security/index.ts
// Barrel export para módulo de seguridad

export { sanitizeHtml, sanitizeText, sanitizeUrl, escapeRegex } from './sanitize';

export {
    ticketSchema,
    loginSchema,
    registerSchema,
    changePasswordSchema,
    chatMessageSchema,
    validate,
    validateField,
    type TicketInput,
    type LoginInput,
    type RegisterInput,
    type ChangePasswordInput,
    type ChatMessageInput,
} from './validation';

export {
    generateCsrfToken,
    getCsrfToken,
    validateCsrfToken,
    regenerateCsrfToken,
    useCsrf
} from './csrf';

export { AuthGuard, withAuth, useAuthUser } from './auth.guard';
