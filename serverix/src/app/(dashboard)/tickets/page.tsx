import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatRelative, getAvatarUrl, getTicketStatusColor, getPriorityColor } from '@/lib/utils'
import { Ticket, Filter, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Tickety' }
export const dynamic = 'force-dynamic'

interface SearchParams { status?: string; priority?: string; search?: string; page?: string }

export default async function TicketsPage({ searchParams: _sp }: { searchParams: Promise<SearchParams> }) {
  const searchParams = await _sp
  const page  = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit = 20
  const skip  = (page - 1) * limit

  const where: any = {}
  if (searchParams.status)   where.status   = searchParams.status
  if (searchParams.priority) where.priority = searchParams.priority
  if (searchParams.search) {
    where.OR = [
      { subject: { contains: searchParams.search, mode: 'insensitive' } },
      { player: { username: { contains: searchParams.search, mode: 'insensitive' } } },
    ]
  }

  const [tickets, total, counts] = await Promise.all([
    prisma.ticket.findMany({
      where, skip, take: limit,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        player:     { select: { username: true, hytaleUuid: true } },
        assignedTo: { select: { username: true } },
        _count:     { select: { replies: true } },
      },
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ['status'], _count: true }),
  ])

  const statusCounts = Object.fromEntries(counts.map(c => [c.status, c._count]))
  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: undefined,          label: 'Vše',              count: total },
          { key: 'OPEN',             label: 'Otevřené',         count: statusCounts['OPEN'] ?? 0 },
          { key: 'IN_PROGRESS',      label: 'Probíhající',      count: statusCounts['IN_PROGRESS'] ?? 0 },
          { key: 'WAITING_PLAYER',   label: 'Čeká na hráče',    count: statusCounts['WAITING_PLAYER'] ?? 0 },
          { key: 'RESOLVED',         label: 'Vyřešeno',         count: statusCounts['RESOLVED'] ?? 0 },
          { key: 'CLOSED',           label: 'Uzavřeno',         count: statusCounts['CLOSED'] ?? 0 },
        ].map(tab => {
          const active = (searchParams.status ?? '') === (tab.key ?? '')
          return (
            <Link
              key={tab.key ?? 'all'}
              href={`/tickets?status=${tab.key ?? ''}&search=${searchParams.search ?? ''}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-accent/10 text-white border border-accent/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-accent text-white' : 'bg-white/[0.08] text-gray-400'}`}>
                  {tab.count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Filters */}
      <form className="sx-card p-4 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={searchParams.search}
          placeholder="Hledat..."
          className="sx-input h-9 text-sm flex-1 min-w-[200px]"
        />
        <select name="priority" defaultValue={searchParams.priority ?? ''} className="sx-select h-9 text-sm w-40">
          <option value="">Všechny priority</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <input type="hidden" name="status" value={searchParams.status ?? ''} />
        <button type="submit" className="sx-btn-secondary h-9 text-sm">
          <Filter className="w-3.5 h-3.5" /> Filtrovat
        </button>
      </form>

      {/* Tickets list */}
      <div className="sx-card overflow-hidden">
        <table className="sx-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Předmět</th>
              <th>Hráč</th>
              <th>Priorita</th>
              <th>Status</th>
              <th>Přiřazen</th>
              <th>Odpovědi</th>
              <th>Vytvořeno</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-600">
                  <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Žádné tickety nenalezeny
                </td>
              </tr>
            ) : tickets.map(t => (
              <tr key={t.id} className={t.priority === 'URGENT' ? 'border-l-2 border-l-red' : ''}>
                <td>
                  <span className="text-xs text-gray-600 font-mono">#{t.ticketNumber}</span>
                </td>
                <td>
                  <Link href={`/tickets/${t.id}`} className="flex items-center gap-2 group">
                    {t.priority === 'URGENT' && <AlertCircle className="w-4 h-4 text-red flex-shrink-0" />}
                    <span className="text-sm text-gray-200 group-hover:text-white transition-colors">
                      {t.subject}
                    </span>
                  </Link>
                  <p className="text-xs text-gray-600 mt-0.5">{t.category}</p>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <img src={getAvatarUrl(t.player.username)} alt="" className="w-6 h-6 rounded-md" />
                    <span className="text-sm text-gray-400">{t.player.username}</span>
                  </div>
                </td>
                <td>
                  <span className={`sx-badge ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                </td>
                <td>
                  <span className={`sx-badge ${getTicketStatusColor(t.status)}`}>{t.status}</span>
                </td>
                <td>
                  <span className="text-sm text-gray-500">
                    {t.assignedTo?.username ?? '—'}
                  </span>
                </td>
                <td>
                  <span className="text-sm text-gray-500">{t._count.replies}</span>
                </td>
                <td>
                  <span className="text-xs text-gray-600">{formatRelative(t.createdAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-end gap-1">
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p2 = i + Math.max(1, page - 3)
            if (p2 > pages) return null
            return (
              <Link
                key={p2}
                href={`?page=${p2}&status=${searchParams.status ?? ''}&search=${searchParams.search ?? ''}`}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-all ${
                  p2 === page ? 'bg-accent text-white' : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]'
                }`}
              >
                {p2}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
