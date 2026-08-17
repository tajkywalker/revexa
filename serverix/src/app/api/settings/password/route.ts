import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  current:     z.string().min(1),
  newPassword: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const adminId = (session.user as any).id

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } })
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const valid = await bcrypt.compare(parsed.data.current, admin.password)
  if (!valid) return NextResponse.json({ error: 'Nesprávné současné heslo' }, { status: 400 })

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.adminUser.update({ where: { id: adminId }, data: { password: hashed } })

  // Audit
  await prisma.auditLog.create({
    data: {
      adminId,
      action: 'PASSWORD_CHANGE',
      details: { username: admin.username },
    },
  })

  return NextResponse.json({ success: true })
}
