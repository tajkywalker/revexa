'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [isPending, start]      = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })
      if (res?.error) {
        setError('Nesprávné jméno nebo heslo.')
        return
      }
      router.push(redirectTo)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-void">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-title font-bold text-white uppercase tracking-widest">AUNARIA</h1>
          <p className="text-sm text-gray-500 mt-1">Přihlaste se do svého účtu</p>
        </div>

        <div className="an-card p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-2">
                Uživatelské jméno
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Tajkunek"
                required
                autoComplete="username"
                className="an-input"
              />
            </div>

            <div>
              <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-2">
                Heslo
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="an-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-crimson p-3 rounded-xl bg-crimson/10 border border-crimson/20">{error}</p>
            )}

            <button type="submit" disabled={isPending} className="an-btn-primary w-full justify-center py-3">
              {isPending ? 'Přihlašuji...' : 'Přihlásit se'}
            </button>
          </form>

          <div className="pt-4 border-t border-white/[0.06] text-center">
            <p className="text-sm text-gray-500">
              Nemáte účet?{' '}
              <Link href="/register" className="text-accent hover:text-accent/80 transition-colors">
                Registrovat se
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          Jsou problémy s přihlášením?{' '}
          <Link href="/tickets?category=GENERAL" className="text-gray-500 hover:text-gray-300 transition-colors">
            Kontaktujte podporu
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-void" />}>
      <LoginForm />
    </Suspense>
  )
}
