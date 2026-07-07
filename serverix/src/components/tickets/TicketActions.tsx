'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, UserCheck, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface Ticket {
  id: string
  status: string
  assignedTo: { id: string; username: string } | null
}

export function TicketActions({ ticket, currentAdminId }: { ticket: Ticket; currentAdminId: string }) {
  const [loading, setLoading] = useState(false)

  async function action(type: 'resolve' | 'close' | 'assign') {
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentAdminId }),
      })
      if (res.ok) {
        toast.success(
          type === 'resolve' ? 'Ticket vyřešen' :
          type === 'close'   ? 'Ticket uzavřen' :
          'Ticket přiřazen'
        )
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  if (ticket.status === 'CLOSED') return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!ticket.assignedTo && (
        <button onClick={() => action('assign')} className="sx-btn-secondary text-sm">
          <UserCheck className="w-3.5 h-3.5" />
          Přiřadit sobě
        </button>
      )}
      {ticket.status !== 'RESOLVED' && (
        <button onClick={() => action('resolve')} className="sx-btn-secondary text-green border-green/20 hover:bg-green/10 text-sm">
          <CheckCircle className="w-3.5 h-3.5" />
          Vyřešit
        </button>
      )}
      <button onClick={() => action('close')} className="sx-btn-ghost text-sm">
        <XCircle className="w-3.5 h-3.5" />
        Uzavřít
      </button>
    </div>
  )
}
