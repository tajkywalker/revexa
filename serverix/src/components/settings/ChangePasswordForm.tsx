'use client'

import { useState, useTransition } from 'react'
import { Key } from 'lucide-react'

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPwd !== confirm) { setError('Hesla se neshodují'); return }
    if (newPwd.length < 8)  { setError('Heslo musí mít alespoň 8 znaků'); return }

    startTransition(async () => {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Chyba'); return }
      setSuccess(true)
      setCurrent(''); setNewPwd(''); setConfirm('')
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  return (
    <div className="sx-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
        <Key className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-title font-semibold text-white uppercase tracking-wide">Změna hesla</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-1.5">
            Současné heslo
          </label>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required className="sx-input" />
        </div>
        <div>
          <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-1.5">
            Nové heslo
          </label>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required className="sx-input" />
        </div>
        <div>
          <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-1.5">
            Potvrdit nové heslo
          </label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="sx-input" />
        </div>
        {error   && <p className="text-xs text-red">{error}</p>}
        {success && <p className="text-xs text-green">Heslo bylo změněno!</p>}
        <button type="submit" disabled={isPending} className="sx-btn-primary">
          {isPending ? 'Ukládám...' : 'Změnit heslo'}
        </button>
      </form>
    </div>
  )
}
