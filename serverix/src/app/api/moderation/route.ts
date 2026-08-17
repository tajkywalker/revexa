import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { z } from 'zod'

const schema = z.object({
  username: z.string().min(1),
  type:     z.enum(['BAN', 'TEMP_BAN', 'MUTE', 'TEMP_MUTE', 'KICK', 'WARN']),
  reason:   z.string().min(1).max(500),
  duration: z.number().int().positive().optional(), // hours for temp types
})

export async function POST(req: NextRequest) {
  // Authorization
  const canWarn = await checkPermission('moderation.warn')
  if (!canWarn) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { username, type, reason, duration } = parsed.data

  // Check elevated permissions for serious punishments
  if (['BAN', 'TEMP_BAN'].includes(type)) {
    const canBan = await checkPermission('moderation.ban')
    if (!canBan) return NextResponse.json({ error: 'Insufficient permissions for ban' }, { status: 403 })
  }
  if (['MUTE', 'TEMP_MUTE'].includes(type)) {
    const canMute = await checkPermission('moderation.mute')
    if (!canMute) return NextResponse.json({ error: 'Insufficient permissions for mute' }, { status: 403 })
  }

  // Find player
  const player = await prisma.player.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  })
  if (!player) return NextResponse.json({ error: 'Hráč nenalezen' }, { status: 404 })

  // Get admin from session
  const { auth } = await import('@/lib/auth')
  const session = await auth()
  const adminId = (session?.user as any)?.id
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const expiresAt = duration
    ? new Date(Date.now() + duration * 60 * 60 * 1000)
    : undefined

  // Create punishment
  const punishment = await prisma.punishment.create({
    data: {
      playerId:  player.id,
      type,
      reason,
      issuedById: adminId,
      expiresAt,
      isActive: true,
    },
  })

  // Update player status for bans
  if (type === 'BAN' || type === 'TEMP_BAN') {
    await prisma.player.update({
      where: { id: player.id },
      data: { status: 'BANNED' },
    })
  } else if (type === 'MUTE' || type === 'TEMP_MUTE') {
    await prisma.player.update({
      where: { id: player.id },
      data: { status: 'MUTED' },
    })
  } else if (type === 'WARN') {
    await prisma.player.update({
      where: { id: player.id },
      data: { status: 'WARNED' },
    })
  }

  // Audit log
  const adminUser = await prisma.adminUser.findUnique({ where: { id: adminId } })
  await prisma.auditLog.create({
    data: {
      adminId,
      action: `PUNISHMENT_${type}`,
      target: player.id,
      details: { punishmentId: punishment.id, reason, expiresAt, username: player.username },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    },
  })

  return NextResponse.json({ success: true, punishment })
}

export async function GET(req: NextRequest) {
  const canView = await checkPermission('moderation.view')
  if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('playerId')
  const active   = searchParams.get('active')

  const where: any = {}
  if (playerId) where.playerId = playerId
  if (active === 'true') where.isActive = true

  const punishments = await prisma.punishment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      issuedBy: { select: { username: true, role: true } },
    },
  })

  return NextResponse.json({ punishments })
}
