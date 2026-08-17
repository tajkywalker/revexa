import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  status:     z.enum(['UNDER_REVIEW', 'ACCEPTED', 'REJECTED']),
  reviewNote: z.string().max(1000).optional(),
})

export async function PATCH(req: NextRequest, { params: _p }: { params: Promise<{ id: string }> }) {
  const { id } = await _p

  const canReview = await checkPermission('recruitments.review')
  if (!canReview) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const session = await auth()
  const adminId = (session?.user as any)?.id
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const rec = await prisma.recruitment.findUnique({ where: { id } })
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.recruitment.update({
    where: { id },
    data: {
      status:       parsed.data.status,
      reviewNote:   parsed.data.reviewNote,
      reviewedById: adminId,
      reviewedAt:   new Date(),
    },
  })

  // Audit
  await prisma.auditLog.create({
    data: {
      adminId,
      action: `RECRUITMENT_${parsed.data.status}`,
      target: id,
      details: { position: rec.position, reviewNote: parsed.data.reviewNote },
    },
  })

  return NextResponse.json({ success: true, recruitment: updated })
}
