import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { Cpu, HardDrive, Users, Activity, Zap, Terminal, Info, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ServerConsole } from '@/components/server/ServerConsole'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

const SERVER_DEFS: Record<string, { name: string; desc: string; color: string; emoji: string }> = {
  SURVIVAL: { name: 'Survival',     desc: 'Universe Update — Planetary Physics',  color: '#3ecf8e', emoji: '⚔️' },
  SLIMEFUN: { name: 'Slimefun 2.0', desc: '3D Machines & Custom Crafting',         color: '#a855f7', emoji: '⚗️' },
  SKYBLOCK: { name: 'Skyblock',     desc: 'Custom Islands & Challenges',           color: '#60a5fa', emoji: '☁️' },
  LOBBY:    { name: 'Lobby',        desc: 'Main Hub — Aunaria Network',            color: '#facc15', emoji: '🏛️' },
  CREATIVE: { name: 'Creative',     desc: 'Build & Design',                        color: '#f97316', emoji: '🎨' },
}

export default async function ServerDetailPage({ params: _p }: { params: Promise<{ id: string }> }) {
  const { id } = await _p
  const upperId = id.toUpperCase()

  const session = await requirePermission('servers.view')
  const role = (session.user as any).role ?? 'HELPER'

  if (!SERVER_DEFS[upperId]) notFound()

  const def = SERVER_DEFS[upperId]

  // Latest stat entry
  const stat = await prisma.serverStat.findFirst({
    where: { server: upperId as any },
    orderBy: { recordedAt: 'desc' },
  })

  // Recent console commands from audit
  const recentCommands = await prisma.auditLog.findMany({
    where: { action: { startsWith: 'CONSOLE_CMD' }, target: upperId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { admin: { select: { username: true } } },
  })

  const canConsole = hasPermission(role, 'servers.console.view')
  const canExecute = hasPermission(role, 'servers.console.execute')

  const memPct = stat ? Math.round(stat.memoryUsed / stat.memoryTotal * 100) : 0

  return (
    <div className="space-y-6 max-w-[1100px]">
      <Link href="/server" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Zpět na servery
      </Link>

      {/* Header */}
      <div className="sx-card p-6 flex items-center gap-4" style={{ borderColor: `${def.color}20` }}>
        <div className="text-3xl">{def.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-title font-bold text-white" style={{ color: def.color }}>{def.name}</h1>
            <span className={`sx-badge ${stat ? 'bg-green/10 text-green border-green/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
              {stat ? 'ONLINE' : 'OFFLINE'}
            </span>
            {!stat && (
              <span className="sx-badge bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                MOCK DATA
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{def.desc}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">play.aunaria.net</p>
          <p className="text-xs text-gray-600 font-mono">{upperId.toLowerCase()}.aunaria.net</p>
        </div>
      </div>

      {/* Stats */}
      {stat ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Hráčů online" value={stat.playerCount.toString()} icon={Users} color={def.color} />
          <StatCard
            label="TPS"
            value={stat.tps.toFixed(1)}
            icon={Activity}
            color={stat.tps >= 19 ? '#3ecf8e' : stat.tps >= 16 ? '#f5c842' : '#e05252'}
          />
          <StatCard
            label="CPU"
            value={`${stat.cpuPercent.toFixed(0)}%`}
            icon={Cpu}
            color={stat.cpuPercent < 70 ? '#3ecf8e' : stat.cpuPercent < 90 ? '#f5c842' : '#e05252'}
          />
          <StatCard
            label="RAM"
            value={`${Math.round(stat.memoryUsed / 1024)}/${Math.round(stat.memoryTotal / 1024)}GB`}
            icon={HardDrive}
            color={memPct < 70 ? '#3ecf8e' : memPct < 90 ? '#f5c842' : '#e05252'}
          />
        </div>
      ) : (
        <div className="sx-card p-8 flex items-center justify-center gap-3 text-gray-500">
          <AlertTriangle className="w-5 h-5" />
          <p>Server je offline nebo není monitorován</p>
        </div>
      )}

      {/* Console */}
      {canConsole ? (
        <div className="sx-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
            <Terminal className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-title font-semibold text-white uppercase tracking-wide">
              Konzole — {def.name}
            </h2>
            <span className="ml-auto sx-badge bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              MOCK — Infrastruktura nezapojena
            </span>
          </div>
          <ServerConsole serverId={upperId} canExecute={canExecute} />
        </div>
      ) : (
        <div className="sx-card p-6 flex items-center gap-3 text-gray-500">
          <Terminal className="w-5 h-5" />
          <p className="text-sm">Nemáte oprávnění zobrazit konzoli.</p>
        </div>
      )}

      {/* Recent commands */}
      {recentCommands.length > 0 && (
        <div className="sx-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-title font-semibold text-white uppercase tracking-wide">Nedávné příkazy</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="sx-table">
              <thead>
                <tr>
                  <th>Čas</th>
                  <th>Admin</th>
                  <th>Příkaz</th>
                </tr>
              </thead>
              <tbody>
                {recentCommands.map(cmd => (
                  <tr key={cmd.id}>
                    <td className="text-xs text-gray-500">{formatDate(cmd.createdAt, 'HH:mm:ss d.M.yyyy')}</td>
                    <td className="text-sm text-gray-300">{cmd.admin.username}</td>
                    <td className="text-sm font-mono text-accent">
                      {typeof cmd.details === 'object' && cmd.details
                        ? (cmd.details as any).command ?? '—'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="sx-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <p className="text-xs text-gray-500 font-title uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-title font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
