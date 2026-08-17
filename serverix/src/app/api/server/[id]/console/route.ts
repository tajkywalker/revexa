import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const VALID_SERVER_IDS = ['SURVIVAL', 'SLIMEFUN', 'SKYBLOCK', 'LOBBY', 'CREATIVE']

const schema = z.object({
  command: z.string().min(1).max(256),
})

// Mock console responses for development
const MOCK_RESPONSES: Record<string, string> = {
  help:    '[Server] Commands: help, list, stop, say, kick, ban, time, weather, tp',
  list:    '[Server] Players online: Tajkunek, SteveBuilder (2/100)',
  tps:     '[Server] TPS: 19.8 (5s avg), 19.7 (1m avg), 19.6 (5m avg)',
  version: '[Server] Aunaria 1.0.0 (API: 1.20.1-R0.1-SNAPSHOT)',
  plugins: '[Server] Plugins (8): AunariaCore, Slimefun2, SurvivalPlus, AntiCheat, EssentialsX, LuckPerms, Vault, ProtocolLib',
}

export async function POST(req: NextRequest, { params: _p }: { params: Promise<{ id: string }> }) {
  const { id } = await _p
  const upperId = id.toUpperCase()

  // Authorization
  const canExecute = await checkPermission('servers.console.execute')
  if (!canExecute) return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  if (!VALID_SERVER_IDS.includes(upperId)) {
    return NextResponse.json({ error: 'Unknown server' }, { status: 404 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid command' }, { status: 400 })

  const session = await auth()
  const adminId = (session?.user as any)?.id

  // Audit ALL console commands
  await prisma.auditLog.create({
    data: {
      adminId,
      action: 'CONSOLE_CMD',
      target: upperId,
      details: { command: parsed.data.command },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    },
  })

  // MOCK: Return fake response
  // In production this would send to the actual game server via WebSocket/RCON
  const cmd = parsed.data.command.toLowerCase().split(' ')[0]
  const mockResponse = MOCK_RESPONSES[cmd] ?? `[Server] Command "${parsed.data.command}" dispatched (MOCK — real infrastructure not yet connected)`

  return NextResponse.json({
    success:  true,
    response: mockResponse,
    mock:     true,
  })
}
