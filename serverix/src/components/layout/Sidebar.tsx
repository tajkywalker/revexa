'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Ticket, Flag, UserPlus,
  Server, Settings, LogOut, Shield, ChevronRight,
} from 'lucide-react'
import { cn, getRoleBg } from '@/lib/utils'

interface NavItem {
  href:    string
  label:   string
  icon:    React.ElementType
  badge?:  number
}

const navItems: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/players',      label: 'Hráči',        icon: Users },
  { href: '/tickets',      label: 'Tickety',      icon: Ticket },
  { href: '/reports',      label: 'Reporty',      icon: Flag },
  { href: '/recruitments', label: 'Nábory',       icon: UserPlus },
  { href: '/server',       label: 'Server',       icon: Server },
  { href: '/settings',     label: 'Nastavení',    icon: Settings },
]

interface SidebarProps {
  user: { username: string; role: string; avatar: string | null }
  badges?: { tickets?: number; reports?: number; recruitments?: number }
}

export function Sidebar({ user, badges = {} }: SidebarProps) {
  const pathname = usePathname()

  const getBadge = (href: string) => {
    if (href === '/tickets')      return badges.tickets
    if (href === '/reports')      return badges.reports
    if (href === '/recruitments') return badges.recruitments
    return undefined
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-deep border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 border border-accent/20">
          <Shield className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-title font-bold text-white tracking-wider uppercase">Serverix</p>
          <p className="text-[10px] text-gray-600 font-title tracking-widest uppercase">Aunaria Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto hide-scrollbar">
        {navItems.map(item => {
          const Icon  = item.icon
          const badge = getBadge(item.href)
          const active = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'bg-accent/10 text-white border border-accent/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-accent' : '')} />
              <span className="flex-1 font-medium">{item.label}</span>
              {badge != null && badge > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center
                                 rounded-full bg-accent text-white text-[10px] font-bold">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 text-accent/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Server status pill */}
      <div className="px-4 py-3 mx-3 mb-2 rounded-lg bg-green/5 border border-green/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse-slow" />
          <span className="text-xs text-green font-title font-semibold tracking-wide">ONLINE</span>
          <span className="ml-auto text-xs text-gray-500">play.aunaria.net</span>
        </div>
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors">
          <div className="relative flex-shrink-0">
            <img
              src={user.avatar ?? `https://minotar.net/avatar/${user.username}/32`}
              alt={user.username}
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green border-2 border-deep" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.username}</p>
            <span className={cn('text-[10px] font-title font-semibold tracking-wide px-1.5 py-0.5 rounded-full border', getRoleBg(user.role))}>
              {user.role}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 rounded-lg text-gray-600 hover:text-red hover:bg-red/10 transition-colors"
            title="Odhlásit se"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
