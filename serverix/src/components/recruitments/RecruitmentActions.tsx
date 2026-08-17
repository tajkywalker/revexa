'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye } from 'lucide-react'

export function RecruitmentActions({ recruitmentId }: { recruitmentId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState<'ACCEPTED' | 'REJECTED' | null>(null)
  const [error, setError] = useState('')

  async function doAction(status: 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW') {
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/recruitments/${recruitmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote: note || undefined }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Chyba'); return }
      setShowNote(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {showNote ? (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-elevated border border-white/[0.08]">
          <p className="text-xs font-title text-gray-500 uppercase tracking-widest">
            {showNote === 'ACCEPTED' ? 'Přijmout s poznámkou' : 'Zamítnout s poznámkou'}
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Volitelná poznámka pro žadatele..."
            rows={3}
            className="sx-textarea"
          />
          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowNote(null)} className="sx-btn-secondary text-xs flex-1">
              Zrušit
            </button>
            <button
              onClick={() => doAction(showNote)}
              disabled={isPending}
              className={`text-xs flex-1 sx-btn ${showNote === 'ACCEPTED' ? 'bg-green/10 hover:bg-green/20 text-green border border-green/20' : 'sx-btn-danger'}`}
            >
              {isPending ? '...' : showNote === 'ACCEPTED' ? 'Přijmout' : 'Zamítnout'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => doAction('UNDER_REVIEW')} disabled={isPending}
            className="sx-btn bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 text-xs">
            <Eye className="w-3.5 h-3.5" />
            Probíhá review
          </button>
          <button onClick={() => setShowNote('ACCEPTED')} disabled={isPending}
            className="sx-btn bg-green/10 hover:bg-green/20 text-green border border-green/20 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Přijmout
          </button>
          <button onClick={() => setShowNote('REJECTED')} disabled={isPending}
            className="sx-btn-danger text-xs">
            <XCircle className="w-3.5 h-3.5" />
            Zamítnout
          </button>
        </div>
      )}
    </div>
  )
}
