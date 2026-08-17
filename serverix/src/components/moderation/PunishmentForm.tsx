'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Shield } from 'lucide-react'

export function PunishmentForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [type, setType] = useState('WARN')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/moderation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, type, reason, duration: duration ? parseInt(duration) : undefined }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Chyba'); return }
        setSuccess(true)
        setTimeout(() => { setOpen(false); setSuccess(false); setUsername(''); setReason(''); setDuration('') }, 1500)
      } catch {
        setError('Síťová chyba')
      }
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="sx-btn-primary">
        <Plus className="w-4 h-4" />
        Nový trest
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="sx-card w-full max-w-md mx-4 shadow-elevated">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <h2 className="font-title font-semibold text-white tracking-wide uppercase text-sm">Nový trest</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-1.5">Hráč</label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Uživatelské jméno"
                  required
                  className="sx-input"
                />
              </div>

              <div>
                <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-1.5">Typ trestu</label>
                <select value={type} onChange={e => setType(e.target.value)} className="sx-select">
                  <option value="WARN">Varování</option>
                  <option value="KICK">Kick</option>
                  <option value="MUTE">Mute (trvalý)</option>
                  <option value="TEMP_MUTE">Temp Mute</option>
                  <option value="TEMP_BAN">Temp Ban</option>
                  <option value="BAN">Ban (trvalý)</option>
                </select>
              </div>

              {(type === 'TEMP_BAN' || type === 'TEMP_MUTE') && (
                <div>
                  <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-1.5">Délka (hodiny)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="24"
                    min="1"
                    required
                    className="sx-input"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-1.5">Důvod</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Uveďte důvod..."
                  required
                  rows={3}
                  className="sx-textarea"
                />
              </div>

              {error && <p className="text-xs text-red">{error}</p>}
              {success && <p className="text-xs text-green">Trest byl udělen!</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="sx-btn-secondary flex-1">
                  Zrušit
                </button>
                <button type="submit" disabled={isPending} className="sx-btn-primary flex-1">
                  {isPending ? 'Ukládám...' : 'Udělit trest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
