// src/types/faq.types.ts
// Tipos para las FAQs

import type { ReactNode } from 'react';

export interface FAQItem {
    color: string;
    title: string;
    description: string;
    questions: string[];
    generalResponse: ReactNode;
    images?: string[];
    video?: string;
}

export interface ProgramOption {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    faqs: FAQItem[];
    loginRole: string;
    isOnline: boolean;
}

export type Modality = 'presencial' | 'remota';
