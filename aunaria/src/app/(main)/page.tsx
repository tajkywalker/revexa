import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Sword, Zap, Cloud, Home, Palette, Users, Activity, ChevronRight, Star, Shield, Cpu, HardDrive } from 'lucide-react'

export const metadata = { title: 'Aunaria — Next Generation Hytale Experience' }
export const dynamic = 'force-dynamic'
export const revalidate = 60

async function getServerStats() {
  const [stats, totalPlayers, onlinePlayers] = await Promise.all([
    prisma.serverStat.findMany({
      take: 5,
      orderBy: { recordedAt: 'desc' },
      distinct: ['server'],
    }),
    prisma.player.count(),
    prisma.player.count({ where: { lastSeen: { gte: new Date(Date.now() - 15 * 60 * 1000) } } }),
  ])
  return { stats, totalPlayers, onlinePlayers }
}

const SERVER_LIST = [
  {
    id: 'SURVIVAL',
    name: 'Survival',
    subtitle: 'Universe Update',
    desc: 'Planetary physics, custom residence systems, portals and advanced survival mechanics.',
    icon: Sword,
    color: '#3ecf8e',
    tags: ['Survival', 'PvE', 'Economy'],
  },
  {
    id: 'SLIMEFUN',
    name: 'Slimefun 2.0',
    subtitle: '3D Machines',
    desc: 'Next-generation Slimefun with 3D machine models, custom electronics and advanced automation.',
    icon: Zap,
    color: '#a855f7',
    tags: ['Tech', 'Crafting', 'Machines'],
  },
  {
    id: 'SKYBLOCK',
    name: 'Skyblock',
    subtitle: 'Island Challenges',
    desc: 'Build your island from nothing. Unique challenges, cooperative islands, and island economy.',
    icon: Cloud,
    color: '#60a5fa',
    tags: ['Skyblock', 'PvE', 'Islands'],
  },
  {
    id: 'LOBBY',
    name: 'Lobby',
    subtitle: 'Main Hub',
    desc: 'The central hub of the Aunaria network. Start your adventure here.',
    icon: Home,
    color: '#facc15',
    tags: ['Hub', 'Events', 'Social'],
  },
  {
    id: 'CREATIVE',
    name: 'Creative',
    subtitle: 'Build & Design',
    desc: 'Unlimited creative freedom. Build, design, and showcase your creations.',
    icon: Palette,
    color: '#f97316',
    tags: ['Creative', 'Building', 'Design'],
  },
]

export default async function HomePage() {
  const { stats, totalPlayers, onlinePlayers } = await getServerStats()
  const totalOnline = stats.reduce((s, a) => s + a.playerCount, 0)

  return (
    <div className="animate-fade-in">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-teal/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-sm text-accent font-title tracking-wide mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {totalOnline > 0 ? `${totalOnline} hráčů online` : 'Připravujeme se...'}
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-title font-bold text-white leading-none mb-6">
            AUNARIA
          </h1>
          <p className="text-xl sm:text-2xl text-accent font-title font-semibold tracking-wide mb-4">
            Next Generation Hytale Experience
          </p>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Prozkoumejte nekonečný vesmír s modifikovanou planetární fyzikou, vlastními rezidencemi,
            portály a Slimefun 2.0 se 3D modely. Zažijte Skyblock jako nikdo jiný.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/servers" className="an-btn-primary text-base px-8 py-3">
              <Activity className="w-5 h-5" />
              Prozkoumat servery
            </Link>
            <a href="https://store.aunaria.net" className="an-btn-secondary text-base px-8 py-3">
              Obchod
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <Stat value={totalPlayers.toLocaleString()} label="Hráčů" />
            <Stat value={`${totalOnline}`} label="Online" accent />
            <Stat value="5" label="Serverů" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
          <div className="w-5 h-8 rounded-full border border-gray-700 flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-gray-500 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Server browser ────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-title font-bold text-white mb-3">
              Herní servery
            </h2>
            <p className="text-gray-400">Vyberte si svůj styl hry</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVER_LIST.map(srv => {
              const stat = stats.find(s => s.server === srv.id)
              const Icon = srv.icon

              return (
                <Link
                  key={srv.id}
                  href={`/servers#${srv.id.toLowerCase()}`}
                  className="an-card p-6 group hover:border-white/[0.12] transition-all hover:-translate-y-1"
                  style={{ '--server-color': srv.color } as React.CSSProperties}
                >
                  {/* Icon + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${srv.color}15`, border: `1px solid ${srv.color}25` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: srv.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {stat ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                          <span className="text-sm font-title font-semibold" style={{ color: srv.color }}>
                            {stat.playerCount}
                          </span>
                          <span className="text-xs text-gray-600">online</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-gray-600" />
                          <span className="text-xs text-gray-600">offline</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <h3 className="text-lg font-title font-bold text-white mb-0.5 group-hover:text-accent transition-colors">
                    {srv.name}
                  </h3>
                  <p className="text-sm font-title" style={{ color: srv.color }}>{srv.subtitle}</p>
                  <p className="text-sm text-gray-400 mt-3 leading-relaxed">{srv.desc}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {srv.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-title font-semibold tracking-wide text-gray-500 bg-white/[0.04] border border-white/[0.06]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-elevated/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-title font-bold text-white mb-3">Proč Aunaria?</h2>
            <p className="text-gray-400">Vše co potřebujete na jednom místě</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Star}
              title="Unikátní herní obsah"
              desc="Slimefun 2.0 se 3D modely, vlastní pluginy, planetární fyzika a pokročilé systémy hry."
              color="#f5c842"
            />
            <FeatureCard
              icon={Shield}
              title="Férová moderace"
              desc="Transparentní moderační systém s možností odvolání. Náš tým je tu pro vás."
              color="#7b52f4"
            />
            <FeatureCard
              icon={Users}
              title="Aktivní komunita"
              desc="Přidejte se k tisícům hráčů. Eventy, soutěže, nábory a komunitní obsah."
              color="#3ecfcf"
            />
          </div>
        </div>
      </section>

      {/* ── Join CTA ──────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="an-card p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-accent-glow opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-title font-bold text-white mb-4">
                Připraveni začít?
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Připojte se na <code className="text-accent font-mono">play.aunaria.net</code> a začněte dobrodružství.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/register" className="an-btn-primary text-base px-8 py-3">
                  Vytvořit účet
                </Link>
                <Link href="/servers" className="an-btn-secondary text-base px-8 py-3">
                  Zobrazit servery
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-2xl sm:text-3xl font-title font-bold ${accent ? 'text-accent' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-500 font-title uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string; color: string
}) {
  return (
    <div className="an-card p-6">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <h3 className="text-lg font-title font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  )
}
