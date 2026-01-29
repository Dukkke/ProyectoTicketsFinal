// src/types/index.ts
// Barrel export para tipos

export type {
    User,
    UserRole,
    AuthResponse,
    LoginCredentials,
    RegisterData,
} from './user.types';

export type {
    Ticket,
    TicketMessage,
    TicketStatus,
    TicketCategory,
    TicketPriority,
    CreateTicketData,
    TicketFilters,
    TicketStats,
} from './ticket.types';

export type {
    FAQItem,
    ProgramOption,
    Modality,
} from './faq.types';
