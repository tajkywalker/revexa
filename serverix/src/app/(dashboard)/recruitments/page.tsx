import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getAvatarUrl, formatRelative } from '@/lib/utils'
import { UserPlus } from 'lucide-react'

export const metadata = { title: 'Nábory' }
export const dynamic = 'force-dynamic'

interface SearchParams { status?: string; position?: string; page?: string }

const positionLabel: Record<string, string> = {
  MODERATOR: 'Moderátor', HELPER: 'Helper', BUILDER: 'Builder',
  DEVELOPER: 'Developer', CONTENT_CREATOR: 'Content Creator', GRAPHIC_DESIGNER: 'Grafik',
}

const statusColor: Record<string, string> = {
  OPEN:         'bg-blue-400/10 text-blue-400 border-blue-400/20',
  UNDER_REVIEW: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  ACCEPTED:     'bg-green/10 text-green border-green/20',
  REJECTED:     'bg-red/10 text-red border-red/20',
  WITHDRAWN:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default async function RecruitmentsPage({ searchParams: _sp }: { searchParams: Promise<SearchParams> }) {
  const searchParams = await _sp
  const page  = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit = 20
  const skip  = (page - 1) * limit

  const where: any = {}
  if (searchParams.status)   where.status   = searchParams.status
  if (searchParams.position) where.position = searchParams.position

  const [recruitments, total] = await Promise.all([
    prisma.recruitment.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        player:     { select: { username: true } },
        reviewedBy: { select: { username: true } },
      },
    }),
    prisma.recruitment.count({ where }),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: 'Vše' },
          { key: 'OPEN', label: 'Nové' },
          { key: 'UNDER_REVIEW', label: 'Probíhá review' },
          { key: 'ACCEPTED', label: 'Přijato' },
          { key: 'REJECTED', label: 'Odmítnuto' },
        ].map(tab => {
          const active = (searchParams.status ?? '') === tab.key
          return (
            <Link
              key={tab.key}
              href={`/recruitments?status=${tab.key}`}
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
              <th>Hráč</th>
              <th>Pozice</th>
              <th>Status</th>
              <th>Věk</th>
              <th>Dostupnost</th>
              <th>Reviewer</th>
              <th>Podáno</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recruitments.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-600">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Žádné přihlášky nenalezeny
                </td>
              </tr>
            ) : recruitments.map(r => (
              <tr key={r.id}>
                <td><span className="text-xs text-gray-600 font-mono">#{r.appNumber}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <img src={getAvatarUrl(r.player.username)} alt="" className="w-7 h-7 rounded-lg" />
                    <span className="text-sm text-gray-200">{r.player.username}</span>
                  </div>
                </td>
                <td>
                  <span className="sx-badge bg-teal/10 text-teal border-teal/20">
                    {positionLabel[r.position] ?? r.position}
                  </span>
                </td>
                <td>
                  <span className={`sx-badge ${statusColor[r.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {r.status}
                  </span>
                </td>
                <td><span className="text-sm text-gray-400">{r.age} let</span></td>
                <td><span className="text-sm text-gray-400">{r.availability}</span></td>
                <td><span className="text-sm text-gray-500">{r.reviewedBy?.username ?? '—'}</span></td>
                <td><span className="text-xs text-gray-600">{formatRelative(r.createdAt)}</span></td>
                <td>
                  <Link
                    href={`/recruitments/${r.id}`}
                    className="text-xs text-accent hover:text-accent/80 font-title tracking-wide"
                  >
                    Detail →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
