import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = session.user as any
  const { content, isInternal } = await req.json()

  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.ticketReply.create({
      data: {
        ticketId:   params.id,
        content,
        authorId:   admin.id,
        isInternal: isInternal ?? false,
      },
    }),
    prisma.ticket.update({
      where: { id: params.id },
      data: { status: 'IN_PROGRESS', updatedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
