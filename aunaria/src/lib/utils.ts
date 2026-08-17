import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import { cs } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null, pattern = 'd. M. yyyy') {
  if (!date) return '—'
  return format(new Date(date), pattern)
}

export function formatRelative(date: Date | string | null) {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: cs })
}

export function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h % 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

export function getAvatarUrl(username: string): string {
  return `https://minotar.net/avatar/${username}/64`
}

export function getVipColor(rank: string): string {
  const map: Record<string, string> = {
    VIP_1: 'text-emerald',
    VIP_2: 'text-purple-400',
    VIP_3: 'text-gold',
    NONE:  'text-gray-500',
  }
  return map[rank] ?? 'text-gray-500'
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE:   'bg-emerald/10 text-emerald border-emerald/20',
    BANNED:   'bg-crimson/10 text-crimson border-crimson/20',
    MUTED:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    WARNED:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
    INACTIVE: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return map[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function truncate(str: string, maxLen = 60): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
