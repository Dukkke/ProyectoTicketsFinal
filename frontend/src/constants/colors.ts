// src/constants/colors.ts
// Colores corporativos UAH Oficiales

export const COLORS = {
    // Principal: Pantone 1665 C
    orange: '#E35205',
    orangeLight: '#FF6B26',
    orangeDark: '#B83A00',

    // Neutros
    black: '#1A1A1A',      // Jet Black
    white: '#FFFFFF',
    gray: '#F2F4F7',       // Light background gray
    grayDark: '#475467',   // Slate gray for text
    grayMedium: '#667085',

    // Estados
    success: '#16A34A',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#0369A1',
    infoLight: '#E0F2FE',
} as const;

// Tipo para los colores
export type ColorKey = keyof typeof COLORS;
export type ColorValue = typeof COLORS[ColorKey];
