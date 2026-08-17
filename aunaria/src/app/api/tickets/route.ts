import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  subject:  z.string().min(3).max(200),
  content:  z.string().min(10).max(2000),
  category: z.enum(['GENERAL', 'BAN_APPEAL', 'BUG_REPORT', 'PURCHASE_ISSUE', 'GRIEF_REPORT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const playerId = session.user.id
  const player   = await prisma.player.findUnique({ where: { id: playerId } })
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  if (player.status === 'BANNED') return NextResponse.json({ error: 'Banned players cannot submit tickets' }, { status: 403 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { subject, content, category, priority } = parsed.data

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      status:   'OPEN',
      priority,
      category,
      playerId,
      replies: {
        create: {
          content,
          playerId,
          isInternal: false,
        },
      },
    },
  })

  return NextResponse.json({ ticket }, { status: 201 })
}
