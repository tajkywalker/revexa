import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getAvatarUrl, formatRelative, getStatusColor } from '@/lib/utils'
import { Flag, CheckCircle, XCircle, Eye } from 'lucide-react'

export const metadata = { title: 'Reporty' }
export const dynamic = 'force-dynamic'

interface SearchParams { status?: string; reason?: string; page?: string }

export default async function ReportsPage({ searchParams: _sp }: { searchParams: Promise<SearchParams> }) {
  const searchParams = await _sp
  const session = await auth()
  const page    = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit   = 20
  const skip    = (page - 1) * limit

  const where: any = {}
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.reason) where.reason = searchParams.reason

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy:   { select: { username: true } },
        targetPlayer: { select: { username: true, status: true } },
        handledBy:    { select: { username: true } },
      },
    }),
    prisma.report.count({ where }),
  ])

  const pages = Math.ceil(total / limit)
  const currentAdmin = session?.user as any

  const reasonColors: Record<string, string> = {
    HACKING:    'bg-red/10 text-red border-red/20',
    GRIEFING:   'bg-orange-400/10 text-orange-400 border-orange-400/20',
    HARASSMENT: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    SPAM:       'bg-blue-400/10 text-blue-400 border-blue-400/20',
    EXPLOIT:    'bg-purple-400/10 text-purple-400 border-purple-400/20',
    OTHER:      'bg-gray-500/10 text-gray-400 border-gray-500/20',
    INAPPROPRIATE_NAME: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: 'Vše' },
          { key: 'PENDING', label: 'Čekající' },
          { key: 'UNDER_REVIEW', label: 'Probíhá' },
          { key: 'RESOLVED', label: 'Vyřešeno' },
          { key: 'DISMISSED', label: 'Zamítnuto' },
        ].map(tab => {
          const active = (searchParams.status ?? '') === tab.key
          return (
            <Link
              key={tab.key}
              href={`/reports?status=${tab.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                active ? 'bg-accent/10 text-white border-accent/20' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border-transparent'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div className="sx-card overflow-hidden">
        <table className="sx-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nahlásil</th>
              <th>Hráč</th>
              <th>Důvod</th>
              <th>Status</th>
              <th>Řeší</th>
              <th>Kdy</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-600">
                  <Flag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Žádné reporty nenalezeny
                </td>
              </tr>
            ) : reports.map(r => (
              <tr key={r.id}>
                <td><span className="text-xs text-gray-600 font-mono">#{r.reportNumber}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <img src={getAvatarUrl(r.reportedBy.username)} alt="" className="w-6 h-6 rounded-md" />
                    <span className="text-sm text-gray-400">{r.reportedBy.username}</span>
                  </div>
                </td>
                <td>
                  <Link href={`/players?search=${r.targetPlayer.username}`} className="flex items-center gap-2 group">
                    <img src={getAvatarUrl(r.targetPlayer.username)} alt="" className="w-6 h-6 rounded-md" />
                    <span className="text-sm text-gray-200 group-hover:text-white">{r.targetPlayer.username}</span>
                  </Link>
                </td>
                <td><span className={`sx-badge ${reasonColors[r.reason] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{r.reason}</span></td>
                <td>
                  <span className={`sx-badge ${
                    r.status === 'PENDING'      ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                    r.status === 'UNDER_REVIEW' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                    r.status === 'RESOLVED'     ? 'bg-green/10 text-green border-green/20' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>{r.status}</span>
                </td>
                <td><span className="text-sm text-gray-500">{r.handledBy?.username ?? '—'}</span></td>
                <td><span className="text-xs text-gray-600">{formatRelative(r.createdAt)}</span></td>
                <td>
                  <div className="flex items-center gap-1">
                    <ReportActionBtn reportId={r.id} type="view" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-end gap-1">
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = i + Math.max(1, page - 3)
            if (p > pages) return null
            return (
              <Link key={p} href={`?page=${p}&status=${searchParams.status ?? ''}`}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-all ${p === page ? 'bg-accent text-white' : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]'}`}>
                {p}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReportActionBtn({ reportId, type }: { reportId: string; type: 'view' | 'resolve' | 'dismiss' }) {
  return (
    <Link href={`/reports/${reportId}`} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors">
      <Eye className="w-3.5 h-3.5" />
    </Link>
  )
}
