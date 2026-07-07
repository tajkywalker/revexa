import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  getAvatarUrl, getStatusColor, getVipColor,
  formatDate, formatRelative, formatPlaytime,
} from '@/lib/utils'
import { Search, Filter, UserX, Crown, Users } from 'lucide-react'

export const metadata = { title: 'Hráči' }
export const dynamic = 'force-dynamic'

interface SearchParams { search?: string; status?: string; vip?: string; page?: string }

export default async function PlayersPage({ searchParams }: { searchParams: SearchParams }) {
  const page  = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit = 25
  const skip  = (page - 1) * limit

  const where: any = {}
  if (searchParams.search) {
    where.OR = [
      { username:    { contains: searchParams.search, mode: 'insensitive' } },
      { hytaleUuid: { contains: searchParams.search, mode: 'insensitive' } },
      { discordUsername: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }
  if (searchParams.status) where.status  = searchParams.status
  if (searchParams.vip)    where.vipRank = searchParams.vip

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where, skip, take: limit,
      orderBy: { lastSeen: 'desc' },
      include: {
        _count: { select: { tickets: true, punishments: true } },
      },
    }),
    prisma.player.count({ where }),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-title tracking-widest">
            {total.toLocaleString()} hráčů celkem
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sx-card p-4 flex flex-wrap gap-3">
        <form className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              name="search"
              defaultValue={searchParams.search}
              placeholder="Hledat podle jména, UUID..."
              className="sx-input pl-9 h-9 text-sm"
            />
          </div>
          <select name="status" defaultValue={searchParams.status ?? ''} className="sx-select h-9 text-sm w-36">
            <option value="">Všechny stavy</option>
            <option value="ACTIVE">Aktivní</option>
            <option value="BANNED">Banned</option>
            <option value="MUTED">Muted</option>
            <option value="WARNED">Warned</option>
          </select>
          <select name="vip" defaultValue={searchParams.vip ?? ''} className="sx-select h-9 text-sm w-36">
            <option value="">Všechna VIP</option>
            <option value="VIP_1">VIP Basic</option>
            <option value="VIP_2">VIP Premium</option>
            <option value="VIP_3">VIP Ultra</option>
          </select>
          <button type="submit" className="sx-btn-primary h-9 text-sm">
            <Filter className="w-3.5 h-3.5" /> Filtrovat
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="sx-card overflow-hidden">
        <table className="sx-table">
          <thead>
            <tr>
              <th>Hráč</th>
              <th>Status</th>
              <th>VIP</th>
              <th>Odehráno</th>
              <th>Tickety</th>
              <th>Tresty</th>
              <th>Naposledy</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-600">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Žádní hráči nenalezeni
                </td>
              </tr>
            ) : players.map(p => (
              <tr key={p.id}>
                <td>
                  <Link href={`/players/${p.id}`} className="flex items-center gap-3 group">
                    <img
                      src={getAvatarUrl(p.username)}
                      alt={p.username}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                        {p.username}
                      </p>
                      <p className="text-xs text-gray-600 font-mono">{p.hytaleUuid.slice(0, 12)}…</p>
                    </div>
                  </Link>
                </td>
                <td>
                  <span className={`sx-badge ${getStatusColor(p.status)}`}>
                    {p.status === 'BANNED' && <UserX className="w-3 h-3" />}
                    {p.status}
                  </span>
                </td>
                <td>
                  {p.vipRank !== 'NONE' ? (
                    <span className={`flex items-center gap-1 text-sm ${getVipColor(p.vipRank)}`}>
                      <Crown className="w-3.5 h-3.5" />
                      {p.vipRank.replace('_', ' ')}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-sm">—</span>
                  )}
                </td>
                <td>
                  <span className="text-sm text-gray-400">{formatPlaytime(p.totalPlaytime)}</span>
                </td>
                <td>
                  <span className="text-sm text-gray-400">{p._count.tickets}</span>
                </td>
                <td>
                  <span className={`text-sm ${p._count.punishments > 0 ? 'text-red' : 'text-gray-500'}`}>
                    {p._count.punishments}
                  </span>
                </td>
                <td>
                  <span className="text-xs text-gray-500" title={formatDate(p.lastSeen)}>
                    {formatRelative(p.lastSeen)}
                  </span>
                </td>
                <td>
                  <Link
                    href={`/players/${p.id}`}
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

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Stránka {page} z {pages} · {total} hráčů
          </p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p2 = i + Math.max(1, page - 3)
              if (p2 > pages) return null
              return (
                <Link
                  key={p2}
                  href={`?page=${p2}&search=${searchParams.search ?? ''}&status=${searchParams.status ?? ''}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-all ${
                    p2 === page
                      ? 'bg-accent text-white'
                      : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]'
                  }`}
                >
                  {p2}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
