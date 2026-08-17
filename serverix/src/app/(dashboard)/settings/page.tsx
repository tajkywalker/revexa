import { requirePermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Settings, User, Shield, Activity, AlertTriangle } from 'lucide-react'
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm'

export const metadata = { title: 'Nastavení' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requirePermission('settings.view')
  const adminId = (session.user as any).id

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      id: true, username: true, email: true, role: true,
      avatar: true, discordId: true, lastLogin: true, createdAt: true,
      twoFactorEnabled: true,
      _count: { select: { auditLogs: true } },
    },
  })

  if (!admin) return <p className="text-red">Chyba: admin nenalezen</p>

  const role = (session.user as any).role ?? 'HELPER'
  const canManage = ['OWNER', 'ADMIN'].includes(role)

  // AI usage stats
  const aiStats = await prisma.aIUsage.aggregate({
    _sum: { costUsd: true, inputTokens: true, outputTokens: true },
    _count: { id: true },
  })

  const aiMode = process.env.AI_MODE ?? 'mock'
  const aiEnabled = process.env.AI_PAID_REQUESTS_ENABLED === 'true'

  return (
    <div className="space-y-6 max-w-[800px]">
      <div>
        <h1 className="text-xl font-title font-bold text-white tracking-wide">Nastavení</h1>
        <p className="text-sm text-gray-500 mt-0.5">Správa účtu a systémová nastavení</p>
      </div>

      {/* Profile */}
      <div className="sx-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <User className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-title font-semibold text-white uppercase tracking-wide">Profil</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={admin.avatar ?? `https://minotar.net/avatar/${admin.username}/64`}
              alt={admin.username}
              className="w-16 h-16 rounded-xl border border-white/[0.1]"
            />
            <div>
              <p className="text-lg font-title font-bold text-white">{admin.username}</p>
              <p className="text-sm text-gray-400">{admin.email}</p>
              <span className="sx-badge mt-1 bg-accent/10 text-accent border-accent/20">{admin.role}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <InfoRow label="Discord" value={admin.discordId ?? 'Nepropojeno'} />
            <InfoRow label="Posledné přihlášení" value={admin.lastLogin?.toLocaleDateString('cs-CZ') ?? '—'} />
            <InfoRow label="Člen od" value={admin.createdAt.toLocaleDateString('cs-CZ')} />
            <InfoRow label="Audit akcí" value={admin._count.auditLogs.toString()} />
          </div>
        </div>
      </div>

      {/* Password */}
      <ChangePasswordForm />

      {/* Security */}
      <div className="sx-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <Shield className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-title font-semibold text-white uppercase tracking-wide">Bezpečnost</h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-elevated border border-white/[0.06]">
            <div>
              <p className="text-sm font-medium text-gray-200">Dvoufaktorová autentizace</p>
              <p className="text-xs text-gray-500 mt-0.5">Zvýšení bezpečnosti přihlášení pomocí TOTP</p>
            </div>
            <span className={`sx-badge ${admin.twoFactorEnabled ? 'bg-green/10 text-green border-green/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
              {admin.twoFactorEnabled ? 'Zapnuto' : 'Vypnuto'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Config (owners/admins only) */}
      {canManage && (
        <div className="sx-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
            <Activity className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-title font-semibold text-white uppercase tracking-wide">AI Konfigurace</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 p-4 rounded-lg bg-elevated border border-white/[0.06]">
                <p className="text-xs text-gray-500 font-title uppercase tracking-widest">Režim</p>
                <p className={`text-lg font-title font-bold mt-1 ${aiMode === 'live' ? 'text-green' : 'text-gold'}`}>
                  {aiMode.toUpperCase()}
                </p>
              </div>
              <div className="flex-1 p-4 rounded-lg bg-elevated border border-white/[0.06]">
                <p className="text-xs text-gray-500 font-title uppercase tracking-widest">Placené požadavky</p>
                <p className={`text-lg font-title font-bold mt-1 ${aiEnabled ? 'text-red' : 'text-green'}`}>
                  {aiEnabled ? 'POVOLENO' : 'ZAKÁZÁNO'}
                </p>
              </div>
            </div>

            {aiEnabled && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red/5 border border-red/20">
                <AlertTriangle className="w-4 h-4 text-red flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red">Placené AI požadavky jsou povoleny. Každý live AI call bude zpoplatněn.</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-elevated border border-white/[0.04]">
                <p className="text-xs text-gray-500 font-title uppercase">Celkem volání</p>
                <p className="text-xl font-title font-bold text-white mt-0.5">{aiStats._count.id}</p>
              </div>
              <div className="p-3 rounded-lg bg-elevated border border-white/[0.04]">
                <p className="text-xs text-gray-500 font-title uppercase">Tokeny</p>
                <p className="text-xl font-title font-bold text-white mt-0.5">
                  {((aiStats._sum.inputTokens ?? 0) + (aiStats._sum.outputTokens ?? 0)).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-elevated border border-white/[0.04]">
                <p className="text-xs text-gray-500 font-title uppercase">Náklady</p>
                <p className="text-xl font-title font-bold text-green mt-0.5">
                  ${(aiStats._sum.costUsd ?? 0).toFixed(4)}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Pro změnu nastavení AI upravte proměnné prostředí: <code className="text-accent">AI_MODE</code> a <code className="text-accent">AI_PAID_REQUESTS_ENABLED</code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-title uppercase tracking-widest">{label}</p>
      <p className="text-sm text-gray-200 mt-0.5">{value}</p>
    </div>
  )
}
