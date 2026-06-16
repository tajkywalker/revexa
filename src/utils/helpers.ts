import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { cs } from 'date-fns/locale';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'd. M. yyyy', { locale: cs });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'd. M.', { locale: cs });
  } catch {
    return dateStr;
  }
}

export function formatDateRelative(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Dnes';
    if (isTomorrow(date)) return 'Zítra';
    if (isYesterday(date)) return 'Včera';
    return format(date, 'd. M. yyyy', { locale: cs });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'd. M. yyyy HH:mm', { locale: cs });
  } catch {
    return dateStr;
  }
}

export function getDayOfWeek(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'EEEE', { locale: cs });
  } catch {
    return '';
  }
}

export function formatMonthYear(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'LLLL yyyy', { locale: cs });
  } catch {
    return dateStr;
  }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
