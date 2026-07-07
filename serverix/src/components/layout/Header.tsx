'use client'

import { Bell, Search, RefreshCw } from 'lucide-react'
import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/players':      'Správa hráčů',
  '/tickets':      'Support Tickety',
  '/reports':      'Reporty hráčů',
  '/recruitments': 'Nábory do týmu',
  '/server':       'Stav serveru',
  '/settings':     'Nastavení',
}

interface HeaderProps {
  notificationCount?: number
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname()

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'Serverix'

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-6
                       bg-deep/80 backdrop-blur-lg border-b border-white/[0.06]">
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-base font-title font-semibold text-white tracking-wide uppercase">
          {title}
        </h1>
        <p className="text-[11px] text-gray-600 font-title tracking-widest">
          AUNARIA SERVERIX
        </p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 w-64 h-9 px-3 rounded-lg
                      bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12]
                      transition-colors">
        <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Hledat hráče, ticket..."
          className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600
                     focus:outline-none"
        />
        <kbd className="text-[10px] text-gray-600 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          title="Obnovit"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors">
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
      </div>
    </header>
  )
}
