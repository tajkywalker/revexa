import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { formatDate, formatRelative, getAvatarUrl } from '@/lib/utils'
import Link from 'next/link'
import { Shield, AlertTriangle, VolumeX, Clock, Zap, Ban, CheckCircle, Search, Filter } from 'lucide-react'
import { PunishmentForm } from '@/components/moderation/PunishmentForm'

export const metadata = { title: 'Moderace' }
export const dynamic = 'force-dynamic'

interface SearchParams { type?: string; active?: string; search?: string; page?: string }

export default async function ModerationPage({ searchParams: _sp }: { searchParams: Promise<SearchParams> }) {
  const sp = await _sp
  const session = await requirePermission('moderation.view')

  const page  = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 30
  const skip  = (page - 1) * limit

  const where: any = {}
  if (sp.type)   where.type   = sp.type
  if (sp.active === 'true')  where.isActive = true
  if (sp.active === 'false') where.isActive = false
  if (sp.search) {
    where.player = { username: { contains: sp.search, mode: 'insensitive' } }
  }

  const [punishments, total] = await Promise.all([
    prisma.punishment.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        player:   { select: { id: true, username: true, status: true } },
        issuedBy: { select: { username: true, role: true } },
      },
    }),
    prisma.punishment.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)
  const role = (session.user as any).role ?? 'HELPER'
  const canBan = ['OWNER', 'ADMIN', 'MODERATOR'].includes(role)

  const typeCounts = await prisma.punishment.groupBy({
    by: ['type'],
    _count: { type: true },
    where: { isActive: true },
  })
  const activeCounts = Object.fromEntries(typeCounts.map(t => [t.type, t._count.type]))

  return (
    <div className="space-y-6 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-title font-bold text-white tracking-wide">Moderace</h1>
          <p className="text-sm text-gray-500 mt-0.5">Přehled trestů a moderačních akcí</p>
        </div>
        {canBan && <PunishmentForm />}
      </div>

      {/* Active summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { type: 'BAN',       label: 'Bany',      icon: Ban,           color: 'text-red' },
          { type: 'TEMP_BAN',  label: 'Temp bany', icon: Clock,         color: 'text-orange-400' },
          { type: 'MUTE',      label: 'Mute',      icon: VolumeX,       color: 'text-yellow-400' },
          { type: 'TEMP_MUTE', label: 'Temp mute', icon: VolumeX,       color: 'text-yellow-300' },
          { type: 'WARN',      label: 'Varování',  icon: AlertTriangle, color: 'text-gold' },
          { type: 'KICK',      label: 'Kicky',     icon: Zap,           color: 'text-gray-400' },
        ].map(item => (
          <Link
            key={item.type}
            href={`/moderation?type=${item.type}&active=true`}
            className="sx-card p-3 flex items-center gap-2 hover:bg-elevated/80 transition-colors"
          >
            <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-title uppercase tracking-wide truncate">{item.label}</p>
              <p className={`text-lg font-title font-bold ${item.color}`}>
                {activeCounts[item.type] ?? 0}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3" method="GET">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            name="search"
            defaultValue={sp.search}
            placeholder="Hledat hráče..."
            className="sx-input pl-9"
          />
        </div>
        <select name="type" defaultValue={sp.type ?? ''} className="sx-select w-auto">
          <option value="">Všechny typy</option>
          <option value="BAN">Ban</option>
          <option value="TEMP_BAN">Temp Ban</option>
          <option value="MUTE">Mute</option>
          <option value="TEMP_MUTE">Temp Mute</option>
          <option value="WARN">Varování</option>
          <option value="KICK">Kick</option>
        </select>
        <select name="active" defaultValue={sp.active ?? ''} className="sx-select w-auto">
          <option value="">Všechny stavy</option>
          <option value="true">Aktivní</option>
          <option value="false">Neaktivní</option>
        </select>
        <button type="submit" className="sx-btn-primary">
          <Filter className="w-4 h-4" />
          Filtrovat
        </button>
      </form>

      {/* Table */}
      <div className="sx-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="sx-table w-full">
            <thead>
              <tr>
                <th>Hráč</th>
                <th>Typ</th>
                <th>Důvod</th>
                <th>Vydáno</th>
                <th>Expiruje</th>
                <th>Stav</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {punishments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Žádné záznamy
                  </td>
                </tr>
              ) : (
                punishments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/players/${p.playerId}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                        <img src={getAvatarUrl(p.player.username)} alt="" className="w-6 h-6 rounded" />
                        <span className="text-sm font-medium text-gray-200">{p.player.username}</span>
                      </Link>
                    </td>
                    <td>
                      <PunishmentTypeBadge type={p.type} />
                    </td>
                    <td>
                      <span className="text-sm text-gray-400 max-w-[200px] block truncate" title={p.reason}>
                        {p.reason}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{formatRelative(p.createdAt)}</td>
                    <td className="text-sm text-gray-500">
                      {p.expiresAt ? formatDate(p.expiresAt) : p.type.includes('BAN') || p.type.includes('MUTE') ? '∞ Trvalý' : '—'}
                    </td>
                    <td>
                      {p.isActive ? (
                        <span className="sx-badge bg-red/10 text-red border-red/20">Aktivní</span>
                      ) : (
                        <span className="sx-badge bg-gray-500/10 text-gray-400 border-gray-500/20">
                          {p.revokedAt ? 'Zrušeno' : 'Expirováno'}
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-gray-500">{p.issuedBy.username}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
            <p className="text-xs text-gray-500">
              Zobrazeno {skip + 1}–{Math.min(skip + limit, total)} z {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/moderation?page=${page - 1}${sp.type ? `&type=${sp.type}` : ''}${sp.search ? `&search=${sp.search}` : ''}`}
                  className="sx-btn-secondary text-xs py-1 px-3">
                  ← Předchozí
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/moderation?page=${page + 1}${sp.type ? `&type=${sp.type}` : ''}${sp.search ? `&search=${sp.search}` : ''}`}
                  className="sx-btn-secondary text-xs py-1 px-3">
                  Další →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PunishmentTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    BAN:       { label: 'BAN',       cls: 'bg-red/10 text-red border-red/20' },
    TEMP_BAN:  { label: 'TEMP BAN',  cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    MUTE:      { label: 'MUTE',      cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    TEMP_MUTE: { label: 'TEMP MUTE', cls: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
    WARN:      { label: 'WARN',      cls: 'bg-gold/10 text-gold border-gold/20' },
    KICK:      { label: 'KICK',      cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  }
  const item = map[type] ?? { label: type, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
  return <span className={`sx-badge ${item.cls}`}>{item.label}</span>
}
