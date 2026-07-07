import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params: _p }: { params: Promise<{ id: string }> }) {
  const params = await _p
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.ticket.update({
    where: { id: params.id },
    data: { status: 'CLOSED', closedAt: new Date() },
  })
  return NextResponse.json({ success: true })
}
