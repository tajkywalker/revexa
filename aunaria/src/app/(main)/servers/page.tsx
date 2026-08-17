import { prisma } from '@/lib/prisma'
import { Cpu, HardDrive, Users, Activity, Wifi, WifiOff } from 'lucide-react'

export const metadata = { title: 'Servery' }
export const dynamic = 'force-dynamic'
export const revalidate = 30

const SERVER_LIST = [
  { id: 'SURVIVAL',  name: 'Survival',     subtitle: 'Universe Update',       color: '#3ecf8e', emoji: '⚔️',  desc: 'Pokročilý survival s planetární fyzikou, vlastními rezidencemi a portály.' },
  { id: 'SLIMEFUN',  name: 'Slimefun 2.0', subtitle: '3D Machines',           color: '#a855f7', emoji: '⚗️',  desc: 'Technologický server s 3D modely, vlastní elektronikou a automatizací.' },
  { id: 'SKYBLOCK',  name: 'Skyblock',     subtitle: 'Island Challenges',     color: '#60a5fa', emoji: '☁️',  desc: 'Budujte ostrov od nuly. Unikátní výzvy, kooperativní ostrovy a ekonomika.' },
  { id: 'LOBBY',     name: 'Lobby',        subtitle: 'Main Hub',              color: '#facc15', emoji: '🏛️', desc: 'Centrální hub Aunaria Network. Odtud začínají všechna dobrodružství.' },
  { id: 'CREATIVE',  name: 'Creative',     subtitle: 'Build & Design',        color: '#f97316', emoji: '🎨',  desc: 'Neomezená kreativní svoboda. Stavte, navrhujte a sdílejte svá díla.' },
]

export default async function ServersPage() {
  const stats = await prisma.serverStat.findMany({
    take: 5,
    orderBy: { recordedAt: 'desc' },
    distinct: ['server'],
  })

  const totalOnline = stats.reduce((s, a) => s + a.playerCount, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-title font-bold text-white mb-3">Herní servery</h1>
        <p className="text-gray-400">
          {totalOnline > 0
            ? `${totalOnline} hráčů právě online na ${stats.filter(s => s.playerCount > 0).length} serverech`
            : 'Server data se načítají...'}
        </p>
        <p className="text-sm text-gray-600 mt-2 font-mono">play.aunaria.net</p>
      </div>

      {/* Server cards */}
      <div className="space-y-4">
        {SERVER_LIST.map(srv => {
          const stat = stats.find(s => s.server === srv.id)
          const isOnline = !!stat && stat.playerCount >= 0
          const memPct = stat ? Math.round(stat.memoryUsed / stat.memoryTotal * 100) : 0

          return (
            <div
              key={srv.id}
              id={srv.id.toLowerCase()}
              className="an-card overflow-hidden"
              style={{ borderColor: isOnline ? `${srv.color}20` : undefined }}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: icon + info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${srv.color}12`, border: `1px solid ${srv.color}20` }}
                    >
                      {srv.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-xl font-title font-bold text-white">{srv.name}</h2>
                        <span className="text-sm font-title" style={{ color: srv.color }}>{srv.subtitle}</span>
                      </div>
                      <p className="text-sm text-gray-400">{srv.desc}</p>
                    </div>
                  </div>

                  {/* Right: status */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {isOnline ? (
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4" style={{ color: srv.color }} />
                        <div>
                          <p className="text-sm font-title font-bold" style={{ color: srv.color }}>
                            {stat?.playerCount ?? 0}
                          </p>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wide">Online</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <WifiOff className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Offline</span>
                      </div>
                    )}

                    <span
                      className="px-3 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wide border"
                      style={isOnline
                        ? { background: `${srv.color}10`, color: srv.color, borderColor: `${srv.color}25` }
                        : { background: 'rgba(255,255,255,0.03)', color: '#6b7280', borderColor: 'rgba(255,255,255,0.06)' }
                      }
                    >
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                {stat && (
                  <div className="mt-5 pt-4 border-t border-white/[0.04] grid grid-cols-4 gap-4">
                    <MiniStat
                      icon={Activity}
                      label="TPS"
                      value={stat.tps.toFixed(1)}
                      good={stat.tps >= 19}
                      warn={stat.tps >= 16}
                    />
                    <MiniStat
                      icon={Cpu}
                      label="CPU"
                      value={`${stat.cpuPercent.toFixed(0)}%`}
                      good={stat.cpuPercent < 70}
                      warn={stat.cpuPercent < 90}
                    />
                    <div className="col-span-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> RAM</span>
                        <span>{Math.round(stat.memoryUsed / 1024)}GB / {Math.round(stat.memoryTotal / 1024)}GB</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${memPct}%`,
                            background: memPct < 70 ? srv.color : memPct < 90 ? '#f5c842' : '#e05252',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* IP box */}
      <div className="an-card p-6 text-center">
        <p className="text-sm text-gray-500 mb-2">Připojte se na</p>
        <p className="text-2xl font-mono font-bold text-accent select-all">play.aunaria.net</p>
        <p className="text-xs text-gray-600 mt-2">Hytale · Java Edition kompatibilní porty</p>
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, good, warn }: {
  icon: React.ElementType; label: string; value: string; good: boolean; warn: boolean
}) {
  const color = good ? '#3ecf8e' : warn ? '#f5c842' : '#e05252'
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3 text-gray-600" />
        <span className="text-[10px] text-gray-600 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-title font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
