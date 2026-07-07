'use client'

import { useState } from 'react'
import { Send, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Props { ticketId: string; adminId: string }

export function TicketReplyForm({ ticketId, adminId }: Props) {
  const [content,    setContent]    = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading,    setLoading]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isInternal, authorId: adminId }),
      })
      if (res.ok) {
        toast.success(isInternal ? 'Interní poznámka přidána' : 'Odpověď odeslána')
        setContent('')
        window.location.reload()
      } else {
        toast.error('Chyba při odesílání')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn(
      'sx-card p-4 space-y-3',
      isInternal && 'border-yellow-400/20 bg-yellow-400/5'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-title font-semibold tracking-widest text-gray-400 uppercase">
          {isInternal ? 'Interní poznámka' : 'Odpověď hráči'}
        </p>
        <button
          type="button"
          onClick={() => setIsInternal(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
            isInternal
              ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
              : 'bg-white/[0.04] text-gray-500 border border-white/[0.08] hover:text-gray-300'
          )}
        >
          <Lock className="w-3 h-3" />
          Interní
        </button>
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={isInternal ? 'Interní poznámka (viditelná jen adminům)...' : 'Napište odpověď hráči...'}
        className={cn(
          'sx-textarea h-28 text-sm resize-none',
          isInternal && 'border-yellow-400/20'
        )}
        required
      />

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={loading || !content.trim()} className="sx-btn-primary text-sm">
          <Send className="w-3.5 h-3.5" />
          {loading ? 'Odesílání...' : isInternal ? 'Přidat poznámku' : 'Odeslat odpověď'}
        </button>
      </div>
    </form>
  )
}
