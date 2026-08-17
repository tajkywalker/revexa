import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const adminId = (session.user as any).id

  const notifications = await prisma.notification.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const unreadCount = await prisma.notification.count({
    where: { adminId, isRead: false },
  })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const adminId = (session.user as any).id

  // Mark all as read
  await prisma.notification.updateMany({
    where: { adminId, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
