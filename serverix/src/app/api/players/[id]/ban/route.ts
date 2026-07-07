import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params: _p }: { params: Promise<{ id: string }> }) {
  const params = await _p
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = session.user as any
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(admin.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { reason, expiresAt } = await req.json()
  if (!reason?.trim()) return NextResponse.json({ error: 'Reason required' }, { status: 400 })

  const player = await prisma.player.findUnique({ where: { id: params.id } })
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.punishment.create({
      data: {
        playerId:   params.id,
        type:       'BAN',
        reason,
        issuedById: admin.id,
        expiresAt:  expiresAt ? new Date(expiresAt) : null,
        isActive:   true,
      },
    }),
    prisma.player.update({
      where: { id: params.id },
      data: { status: 'BANNED' },
    }),
    prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action:  'BAN_PLAYER',
        target:  params.id,
        details: { reason, username: player.username },
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
