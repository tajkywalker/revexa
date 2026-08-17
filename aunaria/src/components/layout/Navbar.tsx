'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Shield, User, Bell, LogOut, Menu, X, Ticket, BookOpen, Users } from 'lucide-react'

const navLinks = [
  { href: '/',        label: 'Home',      exact: true },
  { href: '/servers', label: 'Servery',   exact: false },
  { href: '/store',   label: 'Obchod',    exact: false },
  { href: '/wiki',    label: 'Wiki',      exact: false },
]

export function Navbar() {
  const { data: session } = useSession()
  const pathname  = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Blur background */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-xl border-b border-white/[0.06]" />

      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <span className="font-title font-bold text-white tracking-widest uppercase text-lg">
            AUNARIA
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-title font-medium tracking-wide uppercase transition-all',
                isActive(link.href, link.exact)
                  ? 'text-white bg-white/[0.06]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link href="/tickets" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] transition-colors">
                <Ticket className="w-4 h-4" />
                <span className="font-title text-xs tracking-wide">Tickety</span>
              </Link>
              <Link href={`/profile/${(session.user as any).username ?? session.user.name}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                <img
                  src={session.user.image ?? `https://minotar.net/avatar/${(session.user as any).username ?? 'Steve'}/32`}
                  alt={(session.user as any).username ?? 'Profil'}
                  className="w-6 h-6 rounded-md"
                />
                <span className="hidden md:block text-sm font-medium text-gray-200">
                  {(session.user as any).username ?? session.user.name}
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Odhlásit se"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login"   className="an-btn-ghost text-xs">Přihlásit</Link>
              <Link href="/register" className="an-btn-primary text-xs">Registrovat</Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="relative md:hidden bg-deep/95 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-xl text-sm font-title font-medium tracking-wide uppercase transition-colors',
                  isActive(link.href, link.exact)
                    ? 'bg-accent/10 text-white border border-accent/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
