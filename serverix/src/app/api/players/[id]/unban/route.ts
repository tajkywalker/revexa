import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = session.user as any

  await prisma.$transaction([
    prisma.punishment.updateMany({
      where: { playerId: params.id, type: 'BAN', isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedById: admin.id },
    }),
    prisma.player.update({
      where: { id: params.id },
      data: { status: 'ACTIVE' },
    }),
    prisma.auditLog.create({
      data: { adminId: admin.id, action: 'UNBAN_PLAYER', target: params.id },
    }),
  ])

  return NextResponse.json({ success: true })
}
