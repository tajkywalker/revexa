import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { formatDate, formatRelative, getAvatarUrl, getRoleBg } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, User, Clock, CheckCircle, XCircle, Eye, Star } from 'lucide-react'
import { RecruitmentActions } from '@/components/recruitments/RecruitmentActions'

export const dynamic = 'force-dynamic'

export default async function RecruitmentDetailPage({ params: _p }: { params: Promise<{ id: string }> }) {
  const { id } = await _p
  const session = await requirePermission('recruitments.view')

  const rec = await prisma.recruitment.findUnique({
    where: { id },
    include: {
      player:     { select: { id: true, username: true, status: true, vipRank: true, discordUsername: true, email: true } },
      reviewedBy: { select: { username: true, role: true } },
    },
  })

  if (!rec) notFound()

  const role = (session.user as any).role ?? 'HELPER'
  const canReview = ['OWNER', 'ADMIN'].includes(role)

  const statusMap: Record<string, { label: string; cls: string }> = {
    OPEN:         { label: 'Nová',          cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    UNDER_REVIEW: { label: 'Probíhá',       cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    ACCEPTED:     { label: 'Přijato',       cls: 'bg-green/10 text-green border-green/20' },
    REJECTED:     { label: 'Zamítnuto',     cls: 'bg-red/10 text-red border-red/20' },
    WITHDRAWN:    { label: 'Staženo',       cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  }

  const posMap: Record<string, string> = {
    MODERATOR: 'Moderátor', HELPER: 'Helper', BUILDER: 'Builder',
    DEVELOPER: 'Developer', CONTENT_CREATOR: 'Content Creator', GRAPHIC_DESIGNER: 'Grafik',
  }

  const status = statusMap[rec.status] ?? { label: rec.status, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Back */}
      <Link href="/recruitments" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Zpět na nábory
      </Link>

      {/* Header */}
      <div className="sx-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <img src={getAvatarUrl(rec.player.username)} alt="" className="w-14 h-14 rounded-xl border border-white/[0.1]" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-title font-bold text-white">{rec.player.username}</h1>
                <span className={`sx-badge ${status.cls}`}>{status.label}</span>
              </div>
              <p className="text-sm text-accent font-title font-semibold">{posMap[rec.position] ?? rec.position}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Žádost #{rec.appNumber} · {formatRelative(rec.createdAt)}
              </p>
            </div>
          </div>

          {canReview && ['OPEN', 'UNDER_REVIEW'].includes(rec.status) && (
            <RecruitmentActions recruitmentId={rec.id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Motivace">
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{rec.motivation}</p>
          </Section>

          <Section title="Zkušenosti">
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{rec.experience}</p>
          </Section>

          {rec.extraInfo && (
            <Section title="Doplňující informace">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{rec.extraInfo}</p>
            </Section>
          )}

          {rec.reviewNote && (
            <Section title="Poznámka recenzenta" accent>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{rec.reviewNote}</p>
              {rec.reviewedBy && (
                <p className="text-xs text-gray-500 mt-2">
                  — {rec.reviewedBy.username} · {formatRelative(rec.reviewedAt!)}
                </p>
              )}
            </Section>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Section title="Základní info">
            <dl className="space-y-2">
              <InfoItem label="Věk" value={`${rec.age} let`} />
              <InfoItem label="Časové pásmo" value={rec.timezone} />
              <InfoItem label="Jazyky" value={rec.languages.join(', ')} />
              <InfoItem label="Dostupnost" value={rec.availability} />
            </dl>
          </Section>

          <Section title="Hráč">
            <Link href={`/players/${rec.player.id}`} className="flex items-center gap-2 hover:text-accent transition-colors">
              <User className="w-4 h-4 text-accent" />
              <span className="text-sm text-gray-200">{rec.player.username}</span>
            </Link>
            {rec.player.email && (
              <p className="text-xs text-gray-500 mt-1">{rec.player.email}</p>
            )}
            {rec.player.discordUsername && (
              <p className="text-xs text-gray-500">{rec.player.discordUsername}</p>
            )}
          </Section>

          <Section title="Metadata">
            <dl className="space-y-2">
              <InfoItem label="Odesláno" value={formatDate(rec.createdAt)} />
              <InfoItem label="Aktualizováno" value={formatDate(rec.updatedAt)} />
            </dl>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`sx-card overflow-hidden ${accent ? 'border-accent/20' : ''}`}>
      <div className={`px-5 py-3 border-b border-white/[0.06] ${accent ? 'bg-accent/5' : ''}`}>
        <h3 className="text-xs font-title font-semibold text-gray-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-200 text-right">{value}</dd>
    </div>
  )
}
