'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatRelative } from '@/lib/utils'
import { StickyNote, Plus, Trash2, Lock } from 'lucide-react'

interface Note {
  id:        string
  content:   string
  authorId:  string
  createdAt: Date
  author:    { username: string } | null
}

export function PlayerNotes({
  playerId,
  notes,
  canCreate,
  currentAdminId,
}: {
  playerId:       string
  notes:          Note[]
  canCreate:      boolean
  currentAdminId: string
}) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [draft, setDraft] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setError('')
    start(async () => {
      const res = await fetch(`/api/players/${playerId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft.trim() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Chyba'); return }
      setDraft('')
      setShowForm(false)
      router.refresh()
    })
  }

  async function deleteNote(noteId: string) {
    if (!confirm('Smazat tuto poznámku?')) return
    start(async () => {
      await fetch(`/api/players/${playerId}/note?noteId=${noteId}`, { method: 'DELETE' })
      router.refresh()
    })
  }

  return (
    <div className="sx-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-title font-semibold text-white uppercase tracking-wide">
            Interní poznámky
          </h3>
          <span title="Viditelné jen pro staff"><Lock className="w-3 h-3 text-gray-600" /></span>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="sx-btn-ghost text-xs">
            <Plus className="w-3.5 h-3.5" />
            Přidat
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <form onSubmit={addNote} className="p-4 border-b border-white/[0.04] space-y-3">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Interní poznámka (viditelná jen pro staff)..."
            rows={3}
            required
            className="sx-textarea"
          />
          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="sx-btn-secondary text-xs">Zrušit</button>
            <button type="submit" disabled={isPending || !draft.trim()} className="sx-btn-primary text-xs">
              {isPending ? '...' : 'Uložit poznámku'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-white/[0.03]">
        {notes.length === 0 ? (
          <p className="px-5 py-6 text-xs text-gray-600 text-center">Žádné interní poznámky</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="px-5 py-4 group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-300 leading-relaxed flex-1">{note.content}</p>
                {(note.authorId === currentAdminId) && (
                  <button
                    onClick={() => deleteNote(note.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {note.author?.username ?? '?'} · {formatRelative(note.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
