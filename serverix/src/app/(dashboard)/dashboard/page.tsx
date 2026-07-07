import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users, Ticket, Flag, UserPlus, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Zap,
  Cpu, HardDrive, Activity, Wifi, WifiOff,
  Server, Shield,
} from 'lucide-react'

export const metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

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
    totalAdmins,
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
      take: 5,
      orderBy: { recordedAt: 'desc' },
      distinct: ['server'],
    }),
    prisma.adminUser.count({ where: { isActive: true } }),
  ])

  return {
    stats: {
      totalPlayers, newPlayersToday, bannedPlayers,
      openTickets, urgentTickets, resolvedToday,
      pendingReports, openRecruitments,
      revenueToday: revenueToday._sum.amount ?? 0,
      revenueMonth: revenueMonth._sum.amount ?? 0,
      totalAdmins,
    },
    recent: { recentPunishments, recentTickets, recentRecruitments },
    serverStats: latestStats,
  }
}

const SERVER_DEFINITIONS = [
  { id: 'SURVIVAL',  name: 'Survival',     icon: '⚔️',  color: '#3ecf8e', colorClass: 'text-green-400' },
  { id: 'SLIMEFUN',  name: 'Slimefun 2.0', icon: '⚗️',  color: '#a855f7', colorClass: 'text-purple-400' },
  { id: 'SKYBLOCK',  name: 'Skyblock',     icon: '☁️',  color: '#60a5fa', colorClass: 'text-blue-400' },
  { id: 'LOBBY',     name: 'Lobby',        icon: '🏛️',  color: '#facc15', colorClass: 'text-yellow-400' },
  { id: 'CREATIVE',  name: 'Creative',     icon: '🎨',  color: '#f97316', colorClass: 'text-orange-400' },
]

export default async function DashboardPage() {
  const data = await getDashboardData()
  const { stats, recent, serverStats } = data

  const totalOnline = serverStats.reduce((sum, s) => sum + s.playerCount, 0)
  const avgTps = serverStats.length > 0
    ? serverStats.reduce((sum, s) => sum + s.tps, 0) / serverStats.length
    : 0

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ─── Server Status Hero ─────────────────────────────── */}
      <div className="sx-card overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
              <Server className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-title font-semibold text-white tracking-wide uppercase">
                Stav serverů — Aunaria Network
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {serverStats.length > 0 ? `${totalOnline} hráčů online · ${serverStats.length} serverů aktivních` : 'Žádná data z monitoringu'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-title tracking-wide">LIVE</span>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SERVER_DEFINITIONS.map(srv => {
            const stat = serverStats.find(s => s.server === srv.id)
            const isOnline = !!stat
            const memPct = stat ? Math.round((stat.memoryUsed / stat.memoryTotal) * 100) : 0
            const tpsColor = !stat ? 'text-gray-600'
              : stat.tps >= 19 ? 'text-green-400'
              : stat.tps >= 17 ? 'text-yellow-400'
              : 'text-red-400'

            return (
              <div
                key={srv.id}
                className="rounded-xl border p-4 flex flex-col gap-3 transition-all"
                style={{
                  background: isOnline ? `${srv.color}08` : 'rgba(255,255,255,0.02)',
                  borderColor: isOnline ? `${srv.color}25` : 'rgba(255,255,255,0.05)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{srv.icon}</span>
                    <span className="text-sm font-title font-semibold text-white tracking-wide">
                      {srv.name}
                    </span>
                  </div>
                  {isOnline
                    ? <Wifi className="w-3.5 h-3.5 text-green-400" />
                    : <WifiOff className="w-3.5 h-3.5 text-gray-600" />
                  }
                </div>

                {isOnline && stat ? (
                  <>
                    {/* Players online */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Online</span>
                      <span className="text-sm font-semibold" style={{ color: srv.color }}>
                        {stat.playerCount}
                      </span>
                    </div>

                    {/* TPS */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">TPS</span>
                      <span className={`text-sm font-semibold font-mono ${tpsColor}`}>
                        {stat.tps.toFixed(1)}
                      </span>
                    </div>

                    {/* CPU */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> CPU
                        </span>
                        <span className="text-xs text-gray-300">{stat.cpuPercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(stat.cpuPercent, 100)}%`,
                            background: stat.cpuPercent > 80 ? '#e05252' : stat.cpuPercent > 60 ? '#f5c842' : srv.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* RAM */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <HardDrive className="w-3 h-3" /> RAM
                        </span>
                        <span className="text-xs text-gray-300">
                          {(stat.memoryUsed / 1024).toFixed(1)} / {(stat.memoryTotal / 1024).toFixed(0)} GB
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${memPct}%`,
                            background: memPct > 85 ? '#e05252' : memPct > 65 ? '#f5c842' : srv.color,
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-4">
                    <span className="text-xs text-gray-600">Offline</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

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

      {/* ─── Secondary stats row ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat icon={Users} label="Hráčů online" value={totalOnline.toString()} sub="napříč servery" />
        <MiniStat icon={Activity} label="Avg TPS" value={avgTps > 0 ? avgTps.toFixed(1) : '—'} sub="průměr sítě" colorClass={avgTps >= 19 ? 'text-green-400' : avgTps >= 17 ? 'text-yellow-400' : 'text-red-400'} />
        <MiniStat icon={Shield} label="Admin tým" value={stats.totalAdmins.toString()} sub="aktivních členů" />
        <MiniStat icon={UserPlus} label="Nábory" value={stats.openRecruitments.toString()} sub="čeká na review" />
      </div>

      {/* ─── Activity row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent tickets */}
        <div className="sx-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase flex items-center gap-2">
              <Ticket className="w-4 h-4 text-accent" />
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
            <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
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
            <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-teal" />
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

function MiniStat({
  icon: Icon, label, value, sub, colorClass = 'text-gray-200',
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; colorClass?: string
}) {
  return (
    <div className="sx-card p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-white/[0.04] flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-title tracking-widest uppercase truncate">{label}</p>
        <p className={`text-xl font-title font-bold ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-gray-600">{sub}</p>}
      </div>
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
