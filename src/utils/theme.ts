// ============================================================
// REVEXA - Design Theme
// Tmavý theme inspirovaný screenshotem
// ============================================================

export const Colors = {
  // Primární
  primary: '#E8651A',       // oranžová REVEXA
  primaryDark: '#C4510F',
  primaryLight: '#FF8A40',

  // Pozadí
  background: '#111111',
  surface: '#1C1C1E',       // karty/panely
  surfaceElevated: '#252528', // výše položené panely
  surfaceBorder: '#2C2C2E',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',
  textAccent: '#E8651A',

  // Stavy
  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',
  info: '#0A84FF',

  // Výsledky kontrol
  vyhovuje: '#30D158',
  nevyhovuje: '#FF453A',
  nelze: '#FFD60A',
  neuvedeno: '#48484A',

  // Status zakázek
  statusPlanovana: '#0A84FF',
  statusProbihajici: '#E8651A',
  statusDokoncena: '#30D158',
  statusZrusena: '#FF453A',

  // Ostatní
  divider: '#2C2C2E',
  overlay: 'rgba(0,0,0,0.7)',
  cardShadow: 'rgba(0,0,0,0.4)',
};

export const Typography = {
  // Velikosti
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Váhy
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const SIDEBAR_WIDTH = 220;

// Utility funkce pro status
export function getStatusColor(status: string): string {
  switch (status) {
    case 'planovana': return Colors.statusPlanovana;
    case 'probihajici': return Colors.statusProbihajici;
    case 'dokoncena': return Colors.statusDokoncena;
    case 'zrusena': return Colors.statusZrusena;
    default: return Colors.textSecondary;
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'planovana': return 'Naplánováno';
    case 'probihajici': return 'Probíhá';
    case 'dokoncena': return 'Dokončeno';
    case 'zrusena': return 'Zrušeno';
    default: return status;
  }
}

export function getOrderTypeLabel(type: string): string {
  switch (type) {
    case 'kontrola': return 'Kontrola';
    case 'cisteni': return 'Čištění';
    case 'revize': return 'Revize';
    case 'mereni_co': return 'Měření CO';
    case 'jiny': return 'Jiný';
    default: return type;
  }
}

export function getFuelTypeLabel(type: string): string {
  switch (type) {
    case 'tuha_paliva': return 'Tuhá paliva';
    case 'plyn': return 'Plyn';
    case 'olej': return 'Olej';
    case 'biomasa': return 'Biomasa';
    case 'jiny': return 'Jiný';
    default: return type;
  }
}

export function getObjectTypeLabel(type: string): string {
  switch (type) {
    case 'rodinny_dum': return 'Rodinný dům';
    case 'bytovy_dum': return 'Bytový dům';
    case 'komercni': return 'Komerční';
    case 'prumyslovy': return 'Průmyslový';
    case 'jiny': return 'Jiný';
    default: return type;
  }
}

export function getCheckResultColor(result: string): string {
  switch (result) {
    case 'vyhovuje': return Colors.vyhovuje;
    case 'nevyhovuje': return Colors.nevyhovuje;
    case 'nelze_posoudit': return Colors.nelze;
    default: return Colors.neuvedeno;
  }
}

export function getOverallResultLabel(result: string): string {
  switch (result) {
    case 'vyhovuje': return 'VYHOVUJE';
    case 'nevyhovuje': return 'NEVYHOVUJE';
    case 'podmínečně_vyhovuje': return 'PODMÍNEČNĚ VYHOVUJE';
    default: return result;
  }
}
