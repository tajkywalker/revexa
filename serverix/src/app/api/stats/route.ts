import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const month = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalPlayers, activeBans, openTickets, pendingReports,
    openRecruitments, revenueMonth, latestStats,
  ] = await Promise.all([
    prisma.player.count(),
    prisma.punishment.count({ where: { type: 'BAN', isActive: true } }),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.recruitment.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    prisma.transaction.aggregate({ where: { createdAt: { gte: month }, status: 'completed' }, _sum: { amount: true } }),
    prisma.serverStat.findMany({ take: 4, orderBy: { recordedAt: 'desc' }, distinct: ['server'] }),
  ])

  return NextResponse.json({
    players:      { total: totalPlayers, banned: activeBans },
    tickets:      { open: openTickets },
    reports:      { pending: pendingReports },
    recruitments: { open: openRecruitments },
    revenue:      { month: revenueMonth._sum.amount ?? 0 },
    servers:      latestStats,
  })
}
