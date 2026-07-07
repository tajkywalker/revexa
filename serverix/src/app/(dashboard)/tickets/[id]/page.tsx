import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  getAvatarUrl, getTicketStatusColor, getPriorityColor,
  formatDate, formatRelative,
} from '@/lib/utils'
import { ArrowLeft, Send, Lock, Clock, User, Shield } from 'lucide-react'
import { TicketReplyForm } from '@/components/tickets/TicketReplyForm'
import { TicketActions } from '@/components/tickets/TicketActions'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const [session, ticket] = await Promise.all([
    auth(),
    prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        player:     { select: { id: true, username: true, hytaleUuid: true } },
        assignedTo: { select: { id: true, username: true, avatar: true } },
        resolvedBy: { select: { username: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, username: true, avatar: true, role: true } },
          },
        },
      },
    }),
  ])

  if (!ticket) notFound()

  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED'
  const currentAdmin = session?.user as any

  return (
    <div className="max-w-[900px] space-y-5">
      {/* Back */}
      <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300">
        <ArrowLeft className="w-4 h-4" /> Zpět na tickety
      </Link>

      {/* Ticket header */}
      <div className="sx-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-600 font-mono">#{ticket.ticketNumber}</span>
              <span className={`sx-badge ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
              <span className={`sx-badge ${getTicketStatusColor(ticket.status)}`}>{ticket.status}</span>
            </div>
            <h2 className="text-xl font-title font-bold text-white">{ticket.subject}</h2>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {ticket.player.username}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatRelative(ticket.createdAt)}
              </span>
              {ticket.assignedTo && (
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {ticket.assignedTo.username}
                </span>
              )}
            </div>
          </div>
          <TicketActions ticket={ticket} currentAdminId={currentAdmin?.id} />
        </div>
      </div>

      {/* Replies thread */}
      <div className="space-y-3">
        {ticket.replies.map(reply => {
          const isAdmin = !!reply.author
          const isInternal = reply.isInternal

          return (
            <div
              key={reply.id}
              className={`flex gap-4 ${isAdmin ? 'flex-row-reverse' : ''} ${isInternal ? 'opacity-70' : ''}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={isAdmin
                    ? (reply.author?.avatar ?? getAvatarUrl(reply.author?.username ?? 'Admin'))
                    : getAvatarUrl(ticket.player.username)
                  }
                  alt=""
                  className="w-9 h-9 rounded-xl object-cover"
                />
              </div>

              {/* Bubble */}
              <div className={`flex-1 max-w-[85%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-300">
                    {isAdmin ? reply.author?.username : ticket.player.username}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] text-accent font-title uppercase tracking-wide bg-accent/10 px-1.5 py-0.5 rounded">
                      {reply.author?.role}
                    </span>
                  )}
                  {isInternal && (
                    <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" /> Interní
                    </span>
                  )}
                  <span className="text-xs text-gray-600">{formatDate(reply.createdAt, 'd. M. HH:mm')}</span>
                </div>
                <div className={`p-4 rounded-xl text-sm text-gray-200 leading-relaxed whitespace-pre-wrap ${
                  isAdmin
                    ? 'bg-accent/10 border border-accent/20 rounded-tr-sm'
                    : 'bg-white/[0.04] border border-white/[0.06] rounded-tl-sm'
                } ${isInternal ? 'border-yellow-400/20 bg-yellow-400/5' : ''}`}>
                  {reply.content}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply form */}
      {!isClosed ? (
        <TicketReplyForm ticketId={ticket.id} adminId={currentAdmin?.id} />
      ) : (
        <div className="sx-card p-4 flex items-center gap-3 text-gray-500">
          <Lock className="w-4 h-4" />
          <span className="text-sm">Ticket je uzavřen · {ticket.resolvedBy?.username} · {formatDate(ticket.resolvedAt ?? ticket.closedAt)}</span>
        </div>
      )}
    </div>
  )
}
