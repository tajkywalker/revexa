import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status')
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit  = parseInt(searchParams.get('limit') ?? '25')
  const skip   = (page - 1) * limit

  const where: any = {}
  if (search)  where.OR = [
    { username: { contains: search, mode: 'insensitive' } },
    { hytaleUuid: { contains: search, mode: 'insensitive' } },
  ]
  if (status)  where.status = status

  const [data, total] = await Promise.all([
    prisma.player.findMany({
      where, skip, take: limit,
      orderBy: { lastSeen: 'desc' },
      select: {
        id: true, username: true, hytaleUuid: true, status: true,
        vipRank: true, totalPlaytime: true, lastSeen: true,
        discordUsername: true,
      },
    }),
    prisma.player.count({ where }),
  ])

  return NextResponse.json({ data, total, page, limit, pages: Math.ceil(total / limit) })
}
