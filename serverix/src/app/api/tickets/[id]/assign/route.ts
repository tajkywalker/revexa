import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params: _p }: { params: Promise<{ id: string }> }) {
  const params = await _p
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = session.user as any

  await prisma.ticket.update({
    where: { id: params.id },
    data: { assignedToId: admin.id, status: 'IN_PROGRESS' },
  })
  return NextResponse.json({ success: true })
}
