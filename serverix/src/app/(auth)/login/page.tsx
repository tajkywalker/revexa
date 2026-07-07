'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Shield, Eye, EyeOff, Loader2, Lock, User, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep]     = useState<'credentials' | '2fa'>('credentials')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const [form, setForm] = useState({
    username: '',
    password: '',
    totp: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        username: form.username,
        password: form.password,
        totp: form.totp,
        redirect: false,
      })

      if (res?.error === 'NEEDS_2FA') {
        setStep('2fa')
        setLoading(false)
        return
      }

      if (res?.ok) {
        toast.success('Přihlášení úspěšné')
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.error('Nesprávné přihlašovací údaje')
        setLoading(false)
      }
    } catch {
      toast.error('Chyba serveru')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-accent/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-title font-bold text-white tracking-wider uppercase">
            Serverix
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-title tracking-widest uppercase">
            Aunaria Admin Platform
          </p>
        </div>

        {/* Card */}
        <div className="sx-card p-8">
          <div className="mb-6">
            <h2 className="text-lg font-title font-semibold text-white tracking-wide">
              {step === 'credentials' ? 'Admin přihlášení' : 'Dvoufaktorové ověření'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'credentials'
                ? 'Zadejte své administrátorské přihlašovací údaje'
                : 'Zadejte 6-místný kód z autentifikační aplikace'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 'credentials' && (
              <>
                <div>
                  <label className="block text-xs font-title font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
                    Uživatelské jméno
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      className="sx-input pl-9"
                      placeholder="admin"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-title font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
                    Heslo
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="sx-input pl-9 pr-10"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === '2fa' && (
              <div>
                <label className="block text-xs font-title font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
                  2FA Kód
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={form.totp}
                    onChange={e => setForm(f => ({ ...f, totp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className="sx-input pl-9 text-center text-xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ← Zpět
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'sx-btn-primary w-full justify-center mt-2',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Přihlašování...</>
              ) : (
                <><Shield className="w-4 h-4" />
                  {step === 'credentials' ? 'Přihlásit se' : 'Ověřit'}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-gray-600">nebo</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Discord login */}
          <button
            onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                       bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20
                       text-[#7289DA] text-sm font-semibold transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.03.06a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.995a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Přihlásit přes Discord
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Walker Crew Studio © {new Date().getFullYear()} — Serverix v1.0
        </p>
      </div>
    </div>
  )
}
