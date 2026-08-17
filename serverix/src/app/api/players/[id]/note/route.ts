import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ content: z.string().min(1).max(2000) })

export async function POST(req: NextRequest, { params: _p }: { params: Promise<{ id: string }> }) {
  const { id } = await _p

  const canCreate = await checkPermission('players.notes.create')
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const session = await auth()
  const adminId = (session?.user as any)?.id
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const player = await prisma.player.findUnique({ where: { id } })
  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const note = await prisma.playerNote.create({
    data: { playerId: id, content: parsed.data.content, authorId: adminId },
    include: { author: { select: { username: true } } },
  })

  await prisma.auditLog.create({
    data: {
      adminId,
      action: 'PLAYER_NOTE_CREATE',
      target: id,
      details: { username: player.username },
    },
  })

  return NextResponse.json({ note })
}

export async function DELETE(req: NextRequest, { params: _p }: { params: Promise<{ id: string }> }) {
  const { id } = await _p
  const canCreate = await checkPermission('players.notes.create')
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const session = await auth()
  const adminId = (session?.user as any)?.id
  const noteId  = new URL(req.url).searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'Missing noteId' }, { status: 400 })

  const note = await prisma.playerNote.findFirst({ where: { id: noteId, playerId: id } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only author or owner/admin can delete
  const role = (session?.user as any)?.role ?? 'HELPER'
  const isOwner = ['OWNER', 'ADMIN'].includes(role)
  if (note.authorId !== adminId && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.playerNote.delete({ where: { id: noteId } })
  return NextResponse.json({ success: true })
}
