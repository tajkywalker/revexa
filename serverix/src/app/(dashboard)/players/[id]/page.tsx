import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  getAvatarUrl, getStatusColor, getVipColor, getRoleBg,
  formatDate, formatRelative, formatPlaytime, formatCurrency,
} from '@/lib/utils'
import {
  ArrowLeft, Crown, Ban, VolumeX, AlertTriangle, Clock,
  Gamepad2, Mail, Server, Shield, Calendar, Zap,
} from 'lucide-react'
import { BanPlayerButton } from '@/components/players/BanPlayerButton'
import { PlayerNotes } from '@/components/players/PlayerNotes'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await prisma.player.findUnique({ where: { id }, select: { username: true } })
  return { title: player ? `Hráč: ${player.username}` : 'Hráč nenalezen' }
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: playerId } = await params
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      punishments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { issuedBy: { select: { username: true } } },
      },
      tickets: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      gameStats: true,
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      notes: {
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { tickets: true, reports: true, punishments: true } },
    },
  })

  if (!player) notFound()

  const activeBan  = player.punishments.find(p => p.type === 'BAN' && p.isActive)
  const activeMute = player.punishments.find(p => p.type === 'MUTE' && p.isActive)

  const session   = await auth()
  const adminId   = (session?.user as any)?.id ?? ''
  const adminRole = (session?.user as any)?.role ?? 'HELPER'
  const canViewNotes   = hasPermission(adminRole, 'players.notes.view')
  const canCreateNotes = hasPermission(adminRole, 'players.notes.create')
  const canViewIp      = hasPermission(adminRole, 'players.ip.view')

  // Fetch notes with author names (only if permitted)
  const notesWithAuthors = canViewNotes
    ? await prisma.playerNote.findMany({
        where: { playerId },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { username: true } } },
      })
    : []

  return (
    <div className="max-w-[1200px] space-y-5">
      {/* Back */}
      <Link href="/players" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zpět na seznam
      </Link>

      {/* Profile header */}
      <div className="sx-card p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative">
            <img
              src={getAvatarUrl(player.username)}
              alt={player.username}
              className="w-24 h-24 rounded-2xl border-2 border-white/[0.08]"
            />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
              player.status === 'ACTIVE' ? 'bg-green' : 'bg-gray-600'
            }`} />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-title font-bold text-white">{player.username}</h2>
                  <span className={`sx-badge ${getStatusColor(player.status)}`}>{player.status}</span>
                  {player.vipRank !== 'NONE' && (
                    <span className={`flex items-center gap-1 text-sm font-semibold ${getVipColor(player.vipRank)}`}>
                      <Crown className="w-4 h-4" />
                      {player.vipRank.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 font-mono mt-1">{player.hytaleUuid}</p>
              </div>
              <div className="flex gap-2">
                <BanPlayerButton
                  playerId={player.id}
                  username={player.username}
                  isBanned={!!activeBan}
                />
              </div>
            </div>

            {/* Linked accounts */}
            <div className="flex flex-wrap gap-3 mt-4">
              {player.discordUsername && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 text-sm text-[#7289DA]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.03.06a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.995.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  {player.discordUsername}
                </div>
              )}
              {player.email && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  {player.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Odehráno', value: formatPlaytime(player.totalPlaytime), icon: Clock },
          { label: 'Hlasování', value: player.totalVotes, icon: Zap },
          { label: 'Celkem utraceno', value: formatCurrency(player.totalSpent), icon: Crown },
          { label: 'Poslední aktivita', value: formatRelative(player.lastSeen), icon: Calendar },
        ].map(item => (
          <div key={item.label} className="sx-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="w-3.5 h-3.5 text-accent" />
              <p className="text-xs text-gray-500 font-title tracking-widest uppercase">{item.label}</p>
            </div>
            <p className="text-lg font-title font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Game stats per server */}
        <div className="space-y-4">
          <div className="sx-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase">Statistiky hry</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {player.gameStats.length === 0 ? (
                <p className="px-5 py-6 text-xs text-gray-600 text-center">Žádné herní statistiky</p>
              ) : player.gameStats.map(stat => (
                <div key={stat.id} className="px-5 py-3">
                  <p className="text-xs font-title font-semibold text-accent uppercase tracking-wide mb-2">{stat.server}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { l: 'Kills', v: stat.kills },
                      { l: 'Deaths', v: stat.deaths },
                      { l: 'K/D', v: stat.deaths > 0 ? (stat.kills / stat.deaths).toFixed(2) : stat.kills },
                    ].map(s => (
                      <div key={s.l}>
                        <p className="text-base font-title font-bold text-white">{s.v}</p>
                        <p className="text-[10px] text-gray-600 uppercase font-title">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active sanctions */}
          {(activeBan || activeMute) && (
            <div className="sx-card overflow-hidden border-red/10">
              <div className="px-5 py-4 border-b border-red/10 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red" />
                <h3 className="text-sm font-title font-semibold text-red tracking-wide uppercase">Aktivní sankce</h3>
              </div>
              <div className="p-4 space-y-3">
                {activeBan && (
                  <div className="p-3 rounded-lg bg-red/5 border border-red/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Ban className="w-4 h-4 text-red" />
                      <p className="text-sm font-semibold text-red">BAN</p>
                    </div>
                    <p className="text-xs text-gray-400">{activeBan.reason}</p>
                    <p className="text-xs text-gray-600 mt-1">by {activeBan.issuedBy.username} · {formatDate(activeBan.createdAt)}</p>
                  </div>
                )}
                {activeMute && (
                  <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <VolumeX className="w-4 h-4 text-yellow-400" />
                      <p className="text-sm font-semibold text-yellow-400">MUTE</p>
                    </div>
                    <p className="text-xs text-gray-400">{activeMute.reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 2/3: Punishments history + Tickets */}
        <div className="lg:col-span-2 space-y-4">
          {/* Punishment history */}
          <div className="sx-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase">
                Historie trestů ({player._count.punishments})
              </h3>
            </div>
            {player.punishments.length === 0 ? (
              <p className="px-5 py-8 text-xs text-gray-600 text-center">Žádné tresty</p>
            ) : (
              <table className="sx-table">
                <thead>
                  <tr>
                    <th>Typ</th><th>Důvod</th><th>Admin</th><th>Datum</th><th>Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {player.punishments.map(p => (
                    <tr key={p.id}>
                      <td><span className="sx-badge bg-red/10 text-red border-red/20 text-xs">{p.type}</span></td>
                      <td><p className="text-sm text-gray-400 max-w-xs truncate">{p.reason}</p></td>
                      <td><span className="text-xs text-gray-500">{p.issuedBy.username}</span></td>
                      <td><span className="text-xs text-gray-600">{formatDate(p.createdAt)}</span></td>
                      <td>
                        <span className={`sx-badge text-xs ${p.isActive ? 'bg-red/10 text-red border-red/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                          {p.isActive ? 'Aktivní' : 'Zrušeno'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent tickets */}
          <div className="sx-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase">
                Tickety ({player._count.tickets})
              </h3>
              <Link href={`/tickets?search=${player.username}`} className="text-xs text-accent hover:text-accent/80">
                Zobrazit →
              </Link>
            </div>
            {player.tickets.length === 0 ? (
              <p className="px-5 py-8 text-xs text-gray-600 text-center">Žádné tickety</p>
            ) : (
              <table className="sx-table">
                <thead>
                  <tr><th>#</th><th>Předmět</th><th>Status</th><th>Datum</th></tr>
                </thead>
                <tbody>
                  {player.tickets.map(t => (
                    <tr key={t.id}>
                      <td><span className="text-xs text-gray-600 font-mono">#{t.ticketNumber}</span></td>
                      <td>
                        <Link href={`/tickets/${t.id}`} className="text-sm text-gray-300 hover:text-white truncate max-w-xs block">
                          {t.subject}
                        </Link>
                      </td>
                      <td><span className="text-xs text-gray-500">{t.status}</span></td>
                      <td><span className="text-xs text-gray-600">{formatDate(t.createdAt)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Transactions */}
          {player.transactions.length > 0 && (
            <div className="sx-card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase">
                  Poslední nákupy
                </h3>
              </div>
              <table className="sx-table">
                <thead>
                  <tr><th>Popis</th><th>Částka</th><th>Datum</th></tr>
                </thead>
                <tbody>
                  {player.transactions.map(tx => (
                    <tr key={tx.id}>
                      <td><span className="text-sm text-gray-400">{tx.description}</span></td>
                      <td><span className="text-sm text-green font-semibold">{formatCurrency(tx.amount)}</span></td>
                      <td><span className="text-xs text-gray-600">{formatDate(tx.createdAt)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Staff notes */}
          {canViewNotes && (
            <PlayerNotes
              playerId={player.id}
              notes={notesWithAuthors}
              canCreate={canCreateNotes}
              currentAdminId={adminId}
            />
          )}

          {/* IP info (restricted) */}
          {canViewIp && player.lastIpAddress && (
            <div className="sx-card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-title font-semibold text-red uppercase tracking-wide">
                  IP informace (přísně důvěrné)
                </h3>
              </div>
              <div className="p-5 space-y-2">
                <p className="text-sm text-gray-400">
                  Poslední IP: <code className="font-mono text-accent">{player.lastIpAddress}</code>
                </p>
                {player.ipHistory.length > 1 && (
                  <p className="text-xs text-gray-500">
                    Historie: {player.ipHistory.length} adres
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
