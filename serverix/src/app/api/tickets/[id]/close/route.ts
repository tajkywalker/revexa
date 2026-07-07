import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.ticket.update({
    where: { id: params.id },
    data: { status: 'CLOSED', closedAt: new Date() },
  })
  return NextResponse.json({ success: true })
}
