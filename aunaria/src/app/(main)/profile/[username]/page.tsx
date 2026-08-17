import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate, formatRelative, formatPlaytime, getAvatarUrl, getVipColor, getStatusColor } from '@/lib/utils'
import { Crown, Calendar, Clock, Activity, Sword, Star, Trophy, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: username }
}

export default async function ProfilePage({ params: _p }: { params: Promise<{ username: string }> }) {
  const { username } = await _p

  const player = await prisma.player.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
    include: {
      gameStats:   true,
      punishments: {
        where: { isActive: true },
        select: { type: true, reason: true, createdAt: true, expiresAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!player) notFound()

  // Don't show private staff notes or IP data
  const publicPunishments = player.punishments.filter(
    p => !['KICK', 'WARN'].includes(p.type)
  )

  const totalStats = player.gameStats.reduce((acc, s) => ({
    kills:  acc.kills  + s.kills,
    deaths: acc.deaths + s.deaths,
    placed: acc.placed + s.blocksPlaced,
    broken: acc.broken + s.blocksBroken,
  }), { kills: 0, deaths: 0, placed: 0, broken: 0 })

  const kdr = totalStats.deaths > 0 ? (totalStats.kills / totalStats.deaths).toFixed(2) : totalStats.kills.toString()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      {/* Profile header */}
      <div className="an-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Avatar */}
          <div className="relative">
            <img
              src={player.avatarUrl ?? getAvatarUrl(player.username)}
              alt={player.username}
              className="w-24 h-24 rounded-2xl border-2 border-white/[0.1]"
            />
            {player.vipRank !== 'NONE' && (
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 text-gold" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-title font-bold text-white">{player.username}</h1>
              {player.displayName && player.displayName !== player.username && (
                <span className="text-gray-500">({player.displayName})</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`an-badge ${getStatusColor(player.status)}`}>
                {player.status}
              </span>
              {player.vipRank !== 'NONE' && (
                <span className={`an-badge bg-gold/10 border-gold/30 ${getVipColor(player.vipRank)}`}>
                  <Crown className="w-3 h-3" />
                  {player.vipRank.replace('_', ' ')}
                </span>
              )}
            </div>
            {player.bio && (
              <p className="text-sm text-gray-400 leading-relaxed max-w-lg">{player.bio}</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="an-stat">
              <p className="text-xl font-title font-bold text-accent">{formatPlaytime(player.totalPlaytime)}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide font-title mt-0.5">Odehráno</p>
            </div>
            <div className="an-stat">
              <p className="text-xl font-title font-bold text-teal">{player.totalVotes}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide font-title mt-0.5">Hlasů</p>
            </div>
          </div>
        </div>

        {/* Dates row */}
        <div className="flex flex-wrap gap-6 mt-6 pt-5 border-t border-white/[0.05]">
          {player.firstJoin && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Poprvé: {formatDate(player.firstJoin)}</span>
            </div>
          )}
          {player.lastSeen && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Naposledy: {formatRelative(player.lastSeen)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      {player.gameStats.length > 0 && (
        <div className="an-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-title font-semibold text-white uppercase tracking-wide">Herní statistiky</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatBox label="Zabití" value={totalStats.kills.toLocaleString()} icon={Sword} />
              <StatBox label="Úmrtí" value={totalStats.deaths.toLocaleString()} icon={Activity} />
              <StatBox label="KDR" value={kdr} icon={Trophy} />
              <StatBox label="Bloků" value={(totalStats.placed + totalStats.broken).toLocaleString()} icon={Star} />
            </div>

            {/* Per-server breakdown */}
            {player.gameStats.length > 1 && (
              <div className="space-y-2">
                {player.gameStats.map(gs => (
                  <div key={gs.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated/50 border border-white/[0.04]">
                    <span className="text-xs font-title font-semibold text-gray-400 uppercase tracking-wide w-24 flex-shrink-0">
                      {gs.server}
                    </span>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <span>{formatPlaytime(gs.playtime)}</span>
                      <span>{gs.kills}K / {gs.deaths}D</span>
                      <span>{(gs.blocksPlaced + gs.blocksBroken).toLocaleString()} bloků</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active punishments (public — no private info) */}
      {publicPunishments.length > 0 && (
        <div className="an-card overflow-hidden border-crimson/20">
          <div className="px-6 py-4 border-b border-white/[0.06] bg-crimson/5">
            <h2 className="text-sm font-title font-semibold text-crimson uppercase tracking-wide">Aktivní tresty</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {publicPunishments.map((p, i) => (
              <div key={i} className="px-6 py-4 flex items-start gap-3">
                <span className="sx-badge bg-crimson/10 text-crimson border-crimson/20 mt-0.5">{p.type}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{p.reason}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatDate(p.createdAt)}
                    {p.expiresAt && ` · Expiruje: ${formatDate(p.expiresAt)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-elevated/60 border border-white/[0.05]">
      <Icon className="w-5 h-5 text-gray-500 mb-2" />
      <p className="text-xl font-title font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-600 uppercase tracking-wide font-title mt-0.5">{label}</p>
    </div>
  )
}
