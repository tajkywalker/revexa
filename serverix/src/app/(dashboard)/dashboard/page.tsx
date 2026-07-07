import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users, Ticket, Flag, UserPlus, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Zap,
  Server, Cpu, HardDrive, Activity,
} from 'lucide-react'
import { RecentActivityFeed } from '@/components/charts/RecentActivityFeed'
import { PlayerGrowthChart } from '@/components/charts/PlayerGrowthChart'

export const metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'
export const revalidate = 60

async function getDashboardData() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalPlayers,
    newPlayersToday,
    bannedPlayers,
    openTickets,
    urgentTickets,
    resolvedToday,
    pendingReports,
    openRecruitments,
    revenueToday,
    revenueMonth,
    recentPunishments,
    recentTickets,
    recentRecruitments,
    latestStats,
  ] = await Promise.all([
    prisma.player.count(),
    prisma.player.count({ where: { firstJoin: { gte: todayStart } } }),
    prisma.player.count({ where: { status: 'BANNED' } }),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.ticket.count({ where: { status: 'OPEN', priority: 'URGENT' } }),
    prisma.ticket.count({ where: { status: 'RESOLVED', resolvedAt: { gte: todayStart } } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.recruitment.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    prisma.transaction.aggregate({ where: { createdAt: { gte: todayStart }, status: 'completed' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { createdAt: { gte: monthStart }, status: 'completed' }, _sum: { amount: true } }),
    prisma.punishment.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { player: { select: { username: true } }, issuedBy: { select: { username: true } } },
    }),
    prisma.ticket.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      where: { status: 'OPEN' },
      include: { player: { select: { username: true } } },
    }),
    prisma.recruitment.findMany({
      take: 3, orderBy: { createdAt: 'desc' },
      where: { status: 'OPEN' },
      include: { player: { select: { username: true } } },
    }),
    prisma.serverStat.findMany({
      take: 4,
      orderBy: { recordedAt: 'desc' },
      distinct: ['server'],
    }),
  ])

  return {
    stats: {
      totalPlayers, newPlayersToday, bannedPlayers,
      openTickets, urgentTickets, resolvedToday,
      pendingReports, openRecruitments,
      revenueToday: revenueToday._sum.amount ?? 0,
      revenueMonth: revenueMonth._sum.amount ?? 0,
    },
    recent: { recentPunishments, recentTickets, recentRecruitments },
    serverStats: latestStats,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const { stats, recent, serverStats } = data

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ─── KPI Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Celkem hráčů"
          value={stats.totalPlayers.toLocaleString()}
          sub={`+${stats.newPlayersToday} dnes`}
          color="accent"
        />
        <StatCard
          icon={Ticket}
          label="Otevřené tickety"
          value={stats.openTickets}
          sub={stats.urgentTickets > 0 ? `${stats.urgentTickets}× URGENT` : `${stats.resolvedToday} vyřešeno dnes`}
          color={stats.urgentTickets > 0 ? 'red' : 'teal'}
          alert={stats.urgentTickets > 0}
        />
        <StatCard
          icon={Flag}
          label="Čekající reporty"
          value={stats.pendingReports}
          sub="ke zpracování"
          color={stats.pendingReports > 10 ? 'red' : 'gold'}
          alert={stats.pendingReports > 10}
        />
        <StatCard
          icon={TrendingUp}
          label="Příjmy (měsíc)"
          value={formatCurrency(stats.revenueMonth)}
          sub={`Dnes: ${formatCurrency(stats.revenueToday)}`}
          color="green"
        />
      </div>

      {/* ─── Charts row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Player growth chart */}
        <div className="lg:col-span-2 sx-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase">
                Růst hráčů
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Posledních 30 dní</p>
            </div>
          </div>
          <Suspense fallback={<div className="h-40 flex items-center justify-center text-gray-600 text-sm">Načítání...</div>}>
            <PlayerGrowthChart />
          </Suspense>
        </div>

        {/* Server statuses */}
        <div className="sx-card p-5">
          <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase mb-4">
            Stav serverů
          </h3>
          <div className="space-y-3">
            {[
              { id: 'SURVIVAL', name: 'Survival', color: 'text-green' },
              { id: 'SLIMEFUN', name: 'Slimefun 2.0', color: 'text-purple-400' },
              { id: 'SKYBLOCK', name: 'Skyblock', color: 'text-blue-400' },
              { id: 'LOBBY',    name: 'Lobby', color: 'text-yellow-400' },
            ].map(srv => {
              const stat = serverStats.find(s => s.server === srv.id)
              return (
                <div key={srv.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className={`w-2 h-2 rounded-full ${stat ? 'bg-green' : 'bg-gray-600'} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${srv.color}`}>{srv.name}</p>
                    <p className="text-xs text-gray-600">
                      {stat ? `${stat.playerCount} online · ${stat.tps.toFixed(1)} TPS` : 'Offline'}
                    </p>
                  </div>
                  {stat && (
                    <div className="text-xs text-gray-500 text-right">
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {stat.cpuPercent.toFixed(0)}%
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {Math.round(stat.memoryUsed / 1024)}GB
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Activity row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent tickets */}
        <div className="sx-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase">
              Nejnovější tickety
            </h3>
            <a href="/tickets" className="text-xs text-accent hover:text-accent/80 font-title tracking-wide">
              Zobrazit vše →
            </a>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recent.recentTickets.length === 0 ? (
              <EmptyState text="Žádné otevřené tickety" />
            ) : (
              recent.recentTickets.map(t => (
                <a
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <Ticket className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.player.username} · {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <PriorityDot priority={t.priority} />
                </a>
              ))
            )}
          </div>
        </div>

        {/* Recent punishments */}
        <div className="sx-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase">
              Poslední tresty
            </h3>
            <a href="/players" className="text-xs text-accent hover:text-accent/80 font-title tracking-wide">
              Hráči →
            </a>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recent.recentPunishments.length === 0 ? (
              <EmptyState text="Žádné nedávné tresty" />
            ) : (
              recent.recentPunishments.map(p => (
                <div key={p.id} className="flex items-start gap-3 px-5 py-3.5">
                  <PunishmentIcon type={p.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{p.player.username}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {p.type} · {p.issuedBy.username} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open recruitments */}
        <div className="sx-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase">
              Nové žádosti
            </h3>
            <a href="/recruitments" className="text-xs text-accent hover:text-accent/80 font-title tracking-wide">
              Zobrazit vše →
            </a>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recent.recentRecruitments.length === 0 ? (
              <EmptyState text="Žádné nové žádosti" />
            ) : (
              recent.recentRecruitments.map(r => (
                <a
                  key={r.id}
                  href={`/recruitments/${r.id}`}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{r.player.username}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.position} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────

type Color = 'accent' | 'teal' | 'gold' | 'green' | 'red'

const colorMap: Record<Color, { bg: string; text: string; icon: string }> = {
  accent: { bg: 'bg-accent/10',  text: 'text-accent',     icon: 'text-accent' },
  teal:   { bg: 'bg-teal/10',    text: 'text-teal',       icon: 'text-teal' },
  gold:   { bg: 'bg-gold/10',    text: 'text-gold',       icon: 'text-gold' },
  green:  { bg: 'bg-green/10',   text: 'text-green',      icon: 'text-green' },
  red:    { bg: 'bg-red/10',     text: 'text-red',        icon: 'text-red' },
}

function StatCard({
  icon: Icon, label, value, sub, color = 'accent', alert,
}: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; color?: Color; alert?: boolean
}) {
  const c = colorMap[color]
  return (
    <div className={`sx-card p-5 ${alert ? 'border-red/20' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-title font-semibold tracking-widest text-gray-500 uppercase">{label}</p>
        <div className={`p-1.5 rounded-lg ${c.bg}`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
      </div>
      <p className={`text-3xl font-title font-bold ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    LOW: 'bg-teal', MEDIUM: 'bg-gold', HIGH: 'bg-orange-400', URGENT: 'bg-red',
  }
  return <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${map[priority] ?? 'bg-gray-500'}`} />
}

function PunishmentIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    BAN:       { icon: AlertTriangle, color: 'text-red' },
    TEMP_BAN:  { icon: Clock,         color: 'text-orange-400' },
    MUTE:      { icon: Activity,      color: 'text-yellow-400' },
    WARN:      { icon: Zap,           color: 'text-gold' },
    KICK:      { icon: CheckCircle,   color: 'text-gray-400' },
  }
  const item = map[type] ?? { icon: AlertTriangle, color: 'text-gray-500' }
  const Icon = item.icon
  return <Icon className={`w-4 h-4 ${item.color} mt-0.5 flex-shrink-0`} />
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-5 py-8 text-center text-xs text-gray-600">{text}</div>
  )
}
