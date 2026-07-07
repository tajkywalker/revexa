import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Server, Cpu, HardDrive, Activity, Users, Zap } from 'lucide-react'

export const metadata = { title: 'Server' }
export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function ServerPage() {
  const stats = await prisma.serverStat.findMany({
    take: 4,
    orderBy: { recordedAt: 'desc' },
    distinct: ['server'],
  })

  const servers = [
    { id: 'SURVIVAL',  name: 'Survival',    desc: 'Universe Update',  color: 'text-green' },
    { id: 'SLIMEFUN',  name: 'Slimefun 2.0', desc: '3D Machines',     color: 'text-purple-400' },
    { id: 'SKYBLOCK',  name: 'Skyblock',     desc: 'Coming Soon',     color: 'text-blue-400' },
    { id: 'LOBBY',     name: 'Lobby',        desc: 'Main Hub',        color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map(srv => {
          const stat = stats.find(s => s.server === srv.id)
          const online = !!stat
          const memPct = stat ? Math.round(stat.memoryUsed / stat.memoryTotal * 100) : 0

          return (
            <div key={srv.id} className={`sx-card p-5 ${!online ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-green' : 'bg-gray-600'}`} />
                    <h3 className={`font-title font-bold text-lg tracking-wide ${srv.color}`}>{srv.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500">{srv.desc}</p>
                </div>
                <span className={`sx-badge text-xs ${online ? 'bg-green/10 text-green border-green/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {stat ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="sx-card-elevated p-2">
                      <p className="text-lg font-title font-bold text-white">{stat.playerCount}</p>
                      <p className="text-[10px] text-gray-600 font-title uppercase tracking-wide">Online</p>
                    </div>
                    <div className="sx-card-elevated p-2">
                      <p className={`text-lg font-title font-bold ${stat.tps >= 18 ? 'text-green' : stat.tps >= 15 ? 'text-yellow-400' : 'text-red'}`}>
                        {stat.tps.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-gray-600 font-title uppercase tracking-wide">TPS</p>
                    </div>
                    <div className="sx-card-elevated p-2">
                      <p className={`text-lg font-title font-bold ${stat.cpuPercent < 70 ? 'text-green' : stat.cpuPercent < 90 ? 'text-yellow-400' : 'text-red'}`}>
                        {stat.cpuPercent.toFixed(0)}%
                      </p>
                      <p className="text-[10px] text-gray-600 font-title uppercase tracking-wide">CPU</p>
                    </div>
                  </div>

                  {/* Memory bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> RAM</span>
                      <span>{Math.round(stat.memoryUsed / 1024)}GB / {Math.round(stat.memoryTotal / 1024)}GB ({memPct}%)</span>
                    </div>
                    <div className="h-2 bg-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${memPct < 70 ? 'bg-green' : memPct < 90 ? 'bg-yellow-400' : 'bg-red'}`}
                        style={{ width: `${memPct}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">Poslední záznam: {formatDate(stat.recordedAt, 'HH:mm:ss')}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">Žádná data</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Global stats */}
      <div className="sx-card p-5">
        <h3 className="text-sm font-title font-semibold text-white tracking-wide uppercase mb-4">
          Celkový stav sítě
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Celkem online',
              value: stats.reduce((s, a) => s + a.playerCount, 0),
              icon: Users, color: 'text-accent'
            },
            {
              label: 'Průměrné TPS',
              value: stats.length ? (stats.reduce((s, a) => s + a.tps, 0) / stats.length).toFixed(1) : '—',
              icon: Activity, color: 'text-green'
            },
            {
              label: 'Celkem RAM',
              value: `${Math.round(stats.reduce((s, a) => s + a.memoryUsed, 0) / 1024)}GB`,
              icon: HardDrive, color: 'text-teal'
            },
            {
              label: 'Max CPU',
              value: `${Math.max(...stats.map(s => s.cpuPercent), 0).toFixed(0)}%`,
              icon: Cpu, color: 'text-gold'
            },
          ].map(item => (
            <div key={item.label} className="sx-card-elevated p-4">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <p className="text-xs text-gray-500 font-title uppercase tracking-widest">{item.label}</p>
              </div>
              <p className={`text-2xl font-title font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
