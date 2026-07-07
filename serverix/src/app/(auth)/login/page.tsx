'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        username: form.username,
        password: form.password,
        redirect: false,
      })

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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* ── Fantasy background ── */}
      <div className="absolute inset-0 z-0">
        {/* Night sky base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(170deg, #0a1628 0%, #0d1f3c 20%, #0b2340 40%, #081a2e 60%, #050d1a 80%, #030810 100%)',
          }}
        />
        {/* Moon / pale light top-right */}
        <div
          className="absolute"
          style={{
            top: '-10%',
            right: '8%',
            width: '420px',
            height: '420px',
            background:
              'radial-gradient(circle, rgba(200,210,255,0.10) 0%, rgba(120,150,220,0.05) 40%, transparent 70%)',
          }}
        />
        {/* Portal glow right */}
        <div
          className="absolute"
          style={{
            top: '12%',
            right: '3%',
            width: '340px',
            height: '500px',
            background:
              'radial-gradient(ellipse, rgba(160,60,240,0.35) 0%, rgba(100,30,200,0.18) 40%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
        <div
          className="absolute"
          style={{
            top: '20%',
            right: '5%',
            width: '180px',
            height: '280px',
            background:
              'radial-gradient(ellipse, rgba(200,100,255,0.55) 0%, rgba(150,50,240,0.30) 50%, transparent 80%)',
            filter: 'blur(4px)',
          }}
        />
        {/* Warm lantern glow bottom-left */}
        <div
          className="absolute"
          style={{
            bottom: '5%',
            left: '4%',
            width: '220px',
            height: '260px',
            background:
              'radial-gradient(ellipse, rgba(255,180,60,0.30) 0%, rgba(220,130,30,0.12) 50%, transparent 75%)',
            filter: 'blur(8px)',
          }}
        />
        {/* House/village warm glow left */}
        <div
          className="absolute"
          style={{
            bottom: '20%',
            left: '12%',
            width: '280px',
            height: '200px',
            background:
              'radial-gradient(ellipse, rgba(255,160,50,0.18) 0%, rgba(200,120,30,0.08) 60%, transparent 80%)',
            filter: 'blur(16px)',
          }}
        />
        {/* Water reflection shimmer */}
        <div
          className="absolute"
          style={{
            bottom: '0',
            left: '10%',
            width: '45%',
            height: '35%',
            background:
              'linear-gradient(180deg, transparent 0%, rgba(30,60,120,0.25) 50%, rgba(20,45,90,0.35) 100%)',
          }}
        />
        {/* Ground/stone path */}
        <div
          className="absolute bottom-0 inset-x-0"
          style={{
            height: '30%',
            background:
              'linear-gradient(0deg, rgba(20,18,14,0.9) 0%, rgba(30,28,22,0.6) 50%, transparent 100%)',
          }}
        />
        {/* Tree / foliage top */}
        <div
          className="absolute top-0 right-0"
          style={{
            width: '35%',
            height: '65%',
            background:
              'linear-gradient(220deg, rgba(8,20,8,0.85) 0%, rgba(10,25,10,0.5) 40%, transparent 70%)',
          }}
        />
        {/* Fog / atmosphere */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 120% 80% at 50% 110%, rgba(15,30,60,0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Brushstroke gold panel ── */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div
          style={{
            position: 'absolute',
            width: '680px',
            height: '320px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-2.5deg)',
            background:
              'linear-gradient(105deg, rgba(180,120,20,0.72) 0%, rgba(210,155,35,0.82) 25%, rgba(225,175,50,0.88) 50%, rgba(200,145,30,0.80) 75%, rgba(165,110,15,0.65) 100%)',
            borderRadius: '55% 60% 50% 65% / 40% 50% 45% 55%',
            filter: 'blur(0px)',
            boxShadow: '0 0 60px rgba(200,150,30,0.25), inset 0 0 40px rgba(255,220,80,0.15)',
          }}
        />
        {/* Inner brushstroke texture overlay */}
        <div
          style={{
            position: 'absolute',
            width: '620px',
            height: '260px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-2.5deg)',
            background:
              'repeating-linear-gradient(8deg, transparent, transparent 18px, rgba(255,230,80,0.06) 18px, rgba(255,230,80,0.06) 20px)',
            borderRadius: '55% 60% 50% 65% / 40% 50% 45% 55%',
          }}
        />
      </div>

      {/* ── Main form ── */}
      <div className="relative z-20 w-full max-w-sm px-6 flex flex-col items-center">

        {/* Logo */}
        <div className="mb-8 text-center">
          {/* Diamond ornament top */}
          <div className="flex justify-center mb-1">
            <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
              <path d="M14 0L28 8L14 16L0 8Z" fill="url(#dg)" opacity="0.9"/>
              <defs>
                <linearGradient id="dg" x1="0" y1="0" x2="28" y2="16">
                  <stop stopColor="#f5d060"/>
                  <stop offset="1" stopColor="#c8820a"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* AUNARIA text */}
          <h1
            style={{
              fontFamily: 'var(--font-oswald), sans-serif',
              fontSize: '3.2rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              lineHeight: 1,
              background: 'linear-gradient(180deg, #ffe169 0%, #f5c030 40%, #c88820 70%, #9a6010 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              filter: 'drop-shadow(0 2px 8px rgba(200,140,20,0.55))',
            }}
          >
            AUNARIA
          </h1>

          {/* Separator line */}
          <div className="flex items-center justify-center gap-2 my-1">
            <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, transparent, #c88820)' }} />
            <svg width="8" height="8" viewBox="0 0 8 8">
              <rect x="2" y="0" width="4" height="4" fill="#f5c030" transform="rotate(45 4 4)" opacity="0.8"/>
            </svg>
            <p
              style={{
                fontFamily: 'var(--font-oswald), sans-serif',
                fontSize: '0.70rem',
                letterSpacing: '0.35em',
                color: '#d4a020',
              }}
            >
              HYTALE SERVER
            </p>
            <svg width="8" height="8" viewBox="0 0 8 8">
              <rect x="2" y="0" width="4" height="4" fill="#f5c030" transform="rotate(45 4 4)" opacity="0.8"/>
            </svg>
            <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, #c88820, transparent)' }} />
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">

          {/* Email / Username */}
          <div className="relative">
            <Mail
              className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'rgba(120,80,10,0.9)' }}
            />
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Email"
              required
              autoComplete="username"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1.5px solid rgba(100,65,5,0.7)',
                paddingLeft: '1.6rem',
                paddingBottom: '8px',
                paddingTop: '4px',
                fontSize: '1rem',
                color: 'rgba(60,35,5,0.95)',
                outline: 'none',
                fontFamily: 'var(--font-roboto), sans-serif',
              }}
              className="placeholder-amber-900/60 focus:border-amber-700 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock
              className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'rgba(120,80,10,0.9)' }}
            />
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Password"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1.5px solid rgba(100,65,5,0.7)',
                paddingLeft: '1.6rem',
                paddingRight: '2rem',
                paddingBottom: '8px',
                paddingTop: '4px',
                fontSize: '1rem',
                color: 'rgba(60,35,5,0.95)',
                outline: 'none',
                fontFamily: 'var(--font-roboto), sans-serif',
              }}
              className="placeholder-amber-900/60 focus:border-amber-700 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              className="absolute right-0 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(120,80,10,0.7)' }}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* LOGIN button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 0',
                background: 'rgba(25,18,8,0.88)',
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'var(--font-oswald), sans-serif',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.25em',
                color: '#e8d5a0',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Přihlašování...</>
              ) : (
                'LOGIN'
              )}
            </button>
          </div>

          {/* Forgot password */}
          <div className="text-center pt-1">
            <a
              href="#"
              style={{
                fontSize: '0.78rem',
                color: 'rgba(160,100,10,0.85)',
                fontFamily: 'var(--font-roboto), sans-serif',
                textDecoration: 'none',
              }}
              className="hover:opacity-80 transition-opacity"
            >
              Forgot your password?
            </a>
          </div>
        </form>
      </div>

      {/* ── Walker Crew Studio footer ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        {/* Walker W logo */}
        <svg width="32" height="22" viewBox="0 0 32 22" fill="none">
          <path
            d="M1 1L7 21L12 10L16 18L20 10L25 21L31 1"
            stroke="url(#wg)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="32" y2="22">
              <stop stopColor="#d4a020"/>
              <stop offset="1" stopColor="#8a6010"/>
            </linearGradient>
          </defs>
        </svg>
        <p
          style={{
            fontFamily: 'var(--font-oswald), sans-serif',
            fontSize: '0.60rem',
            letterSpacing: '0.30em',
            color: 'rgba(180,130,30,0.70)',
          }}
        >
          CREATED BY WALKER CREW STUDIO
        </p>
      </div>
    </div>
  )
}
