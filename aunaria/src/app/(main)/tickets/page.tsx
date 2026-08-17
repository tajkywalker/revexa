import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatRelative } from '@/lib/utils'
import Link from 'next/link'
import { Ticket, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Moje tickety' }
export const dynamic = 'force-dynamic'

export default async function TicketsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login?redirect=/tickets')

  const playerId = session.user.id

  const tickets = await prisma.ticket.findMany({
    where: { playerId },
    orderBy: { updatedAt: 'desc' },
    include: {
      replies: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  function getStatusIcon(status: string) {
    switch (status) {
      case 'OPEN':           return <AlertCircle className="w-4 h-4 text-blue-400" />
      case 'IN_PROGRESS':    return <Clock className="w-4 h-4 text-purple-400" />
      case 'WAITING_PLAYER': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'RESOLVED':       return <CheckCircle className="w-4 h-4 text-emerald" />
      case 'CLOSED':         return <XCircle className="w-4 h-4 text-gray-400" />
      default:               return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const statusLabel: Record<string, string> = {
    OPEN:           'Otevřený',
    IN_PROGRESS:    'Probíhá',
    WAITING_PLAYER: 'Čeká na tebe',
    RESOLVED:       'Vyřešeno',
    CLOSED:         'Uzavřeno',
  }

  const priorityColor: Record<string, string> = {
    LOW:    'text-teal',
    MEDIUM: 'text-yellow-400',
    HIGH:   'text-orange-400',
    URGENT: 'text-crimson',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-title font-bold text-white">Moje tickety</h1>
          <p className="text-sm text-gray-500 mt-1">{tickets.length} ticketů</p>
        </div>
        <Link href="/tickets/new" className="an-btn-primary">
          <Plus className="w-4 h-4" />
          Nový ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="an-card p-12 flex flex-col items-center gap-4 text-center">
          <Ticket className="w-12 h-12 text-gray-600" />
          <p className="text-gray-400">Nemáte žádné tickety</p>
          <Link href="/tickets/new" className="an-btn-primary">Vytvořit ticket</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const lastReply = ticket.replies[0]
            const hasNewReply = lastReply && !lastReply.playerId // staff reply
            return (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="an-card p-5 flex items-start gap-4 hover:border-white/[0.12] transition-all block"
              >
                <div className="mt-0.5 flex-shrink-0">{getStatusIcon(ticket.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-200 truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasNewReply && (
                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-[10px] font-title font-bold uppercase tracking-wide">
                          Nová odpověď
                        </span>
                      )}
                      <span className={`text-[10px] font-title font-semibold uppercase tracking-wide ${priorityColor[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>#{ticket.ticketNumber}</span>
                    <span>·</span>
                    <span>{statusLabel[ticket.status] ?? ticket.status}</span>
                    <span>·</span>
                    <span>{formatRelative(ticket.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
