'use client'

import { useState } from 'react'
import { Ban, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Props {
  playerId: string
  username: string
  isBanned: boolean
}

export function BanPlayerButton({ playerId, username, isBanned }: Props) {
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [reason, setReason] = useState('')

  async function handleBan() {
    if (!reason.trim()) { toast.error('Zadej důvod banu'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/players/${playerId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        toast.success(`Hráč ${username} byl zabanován`)
        setShowDialog(false)
        window.location.reload()
      } else {
        toast.error('Chyba při banování')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleUnban() {
    setLoading(true)
    try {
      const res = await fetch(`/api/players/${playerId}/unban`, { method: 'POST' })
      if (res.ok) {
        toast.success(`Ban hráče ${username} byl zrušen`)
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {isBanned ? (
        <button
          onClick={handleUnban}
          disabled={loading}
          className="sx-btn-secondary text-green border-green/20 hover:bg-green/10 text-sm h-9"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Odban
        </button>
      ) : (
        <button
          onClick={() => setShowDialog(true)}
          className="sx-btn-danger text-sm h-9"
        >
          <Ban className="w-3.5 h-3.5" />
          Ban
        </button>
      )}

      {/* Ban dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="sx-card p-6 w-full max-w-md animate-slide-in">
            <h3 className="text-base font-title font-bold text-white mb-1">Ban hráče</h3>
            <p className="text-sm text-gray-500 mb-4">Hráč: <span className="text-white">{username}</span></p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-title font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
                  Důvod banu
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="sx-textarea text-sm h-20"
                  placeholder="Uveď důvod..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDialog(false)} className="sx-btn-ghost text-sm">Zrušit</button>
                <button onClick={handleBan} disabled={loading} className="sx-btn-danger text-sm">
                  {loading ? 'Banování...' : 'Potvrdit ban'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
