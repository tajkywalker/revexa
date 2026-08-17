'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'GENERAL',        label: 'Obecné',          desc: 'Obecné dotazy a problémy' },
  { value: 'BAN_APPEAL',     label: 'Ban Appeal',      desc: 'Odvolání proti banu' },
  { value: 'BUG_REPORT',     label: 'Bug Report',      desc: 'Nahlášení chyby' },
  { value: 'PURCHASE_ISSUE', label: 'Nákup',           desc: 'Problém s nákupem' },
  { value: 'GRIEF_REPORT',   label: 'Report hráče',    desc: 'Nahlásit chování hráče' },
  { value: 'OTHER',          label: 'Ostatní',         desc: 'Jiný problém' },
]

const PRIORITIES = [
  { value: 'LOW',    label: 'Nízká',   color: 'text-teal' },
  { value: 'MEDIUM', label: 'Střední', color: 'text-yellow-400' },
  { value: 'HIGH',   label: 'Vysoká',  color: 'text-orange-400' },
]

export function NewTicketForm({ defaultCategory, playerId }: { defaultCategory?: string; playerId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [category, setCategory] = useState(defaultCategory ?? 'GENERAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [subject, setSubject]   = useState('')
  const [content, setContent]   = useState('')
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!subject.trim()) { setError('Zadejte předmět'); return }
    if (!content.trim()) { setError('Zadejte popis'); return }

    startTransition(async () => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, priority, subject: subject.trim(), content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Chyba'); return }
      router.push(`/tickets/${data.ticket.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category */}
      <div>
        <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-3">
          Kategorie
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                category === cat.value
                  ? 'bg-accent/10 border-accent/30 text-white'
                  : 'bg-elevated/50 border-white/[0.06] text-gray-400 hover:border-white/[0.12] hover:text-gray-200'
              }`}
            >
              <p className="text-sm font-semibold">{cat.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-3">
          Priorita
        </label>
        <div className="flex gap-2">
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`flex-1 py-2 rounded-xl border text-sm font-title font-semibold transition-all ${
                priority === p.value
                  ? `${p.color} bg-white/[0.06] border-white/[0.12]`
                  : 'text-gray-500 border-white/[0.06] hover:border-white/[0.1]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-2">
          Předmět
        </label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Stručný popis problému"
          required
          maxLength={200}
          className="an-input"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-title text-gray-500 uppercase tracking-widest mb-2">
          Popis
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Popište svůj problém co nejpodrobněji. Uveďte kdy k problému došlo, na jakém serveru, a co jste dělali."
          required
          rows={6}
          className="an-input resize-y"
        />
        <p className="text-xs text-gray-600 mt-1">{content.length}/2000 znaků</p>
      </div>

      {error && (
        <p className="text-sm text-crimson p-3 rounded-xl bg-crimson/10 border border-crimson/20">{error}</p>
      )}

      <div className="flex gap-3">
        <Link href="/tickets" className="an-btn-secondary">
          <ChevronLeft className="w-4 h-4" />
          Zpět
        </Link>
        <button type="submit" disabled={isPending} className="an-btn-primary flex-1">
          <Send className="w-4 h-4" />
          {isPending ? 'Odesílám...' : 'Odeslat ticket'}
        </button>
      </div>
    </form>
  )
}
