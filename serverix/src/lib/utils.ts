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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function getAvatarUrl(username: string): string {
  return `https://minotar.net/avatar/${username}/64`
}

export function getRoleColor(role: string): string {
  const map: Record<string, string> = {
    OWNER: 'text-red-400',
    ADMIN: 'text-orange-400',
    MODERATOR: 'text-yellow-400',
    HELPER: 'text-green-400',
    BUILDER: 'text-blue-400',
    DEVELOPER: 'text-purple-400',
  }
  return map[role] ?? 'text-gray-400'
}

export function getRoleBg(role: string): string {
  const map: Record<string, string> = {
    OWNER: 'bg-red-500/10 text-red-400 border-red-500/20',
    ADMIN: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    MODERATOR: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    HELPER: 'bg-green-500/10 text-green-400 border-green-500/20',
    BUILDER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DEVELOPER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }
  return map[role] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE:   'bg-green-500/10 text-green-400 border-green-500/20',
    BANNED:   'bg-red-500/10 text-red-400 border-red-500/20',
    MUTED:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    WARNED:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
    INACTIVE: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return map[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    LOW:    'bg-teal-500/10 text-teal-400 border-teal-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    HIGH:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
    URGENT: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return map[priority] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getTicketStatusColor(status: string): string {
  const map: Record<string, string> = {
    OPEN:           'bg-blue-500/10 text-blue-400 border-blue-500/20',
    IN_PROGRESS:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
    WAITING_PLAYER: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    RESOLVED:       'bg-green-500/10 text-green-400 border-green-500/20',
    CLOSED:         'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return map[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getVipColor(rank: string): string {
  const map: Record<string, string> = {
    VIP_1: 'text-green-400',
    VIP_2: 'text-purple-400',
    VIP_3: 'text-yellow-400',
    NONE:  'text-gray-500',
  }
  return map[rank] ?? 'text-gray-500'
}

export function truncate(str: string, maxLen = 60): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
