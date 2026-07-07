import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Serverix database...')

  // Create default admin
  const hashedPwd = await bcrypt.hash('admin123', 12)

  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@aunaria.net',
      password: hashedPwd,
      role: 'OWNER',
      isActive: true,
    },
  })
  console.log('Created admin:', admin.username)

  // Create test players
  const players = await Promise.all([
    prisma.player.upsert({
      where: { hytaleUuid: 'uuid-tajkunek-001' },
      update: {},
      create: {
        hytaleUuid: 'uuid-tajkunek-001',
        username: 'Tajkunek',
        status: 'ACTIVE',
        vipRank: 'VIP_3',
        totalPlaytime: 14700,
        totalVotes: 156,
        totalSpent: 2450,
        balance: 15600,
        discordUsername: 'Tajkunek#0001',
        email: 'tajky@example.com',
        firstJoin: new Date('2026-01-15'),
        lastSeen: new Date(),
        bio: 'I love Hytale.',
      },
    }),
    prisma.player.upsert({
      where: { hytaleUuid: 'uuid-steve-002' },
      update: {},
      create: {
        hytaleUuid: 'uuid-steve-002',
        username: 'SteveBuilder',
        status: 'ACTIVE',
        vipRank: 'VIP_1',
        totalPlaytime: 3420,
        totalVotes: 48,
        firstJoin: new Date('2026-02-10'),
        lastSeen: new Date(Date.now() - 86400000),
      },
    }),
    prisma.player.upsert({
      where: { hytaleUuid: 'uuid-griefer-003' },
      update: {},
      create: {
        hytaleUuid: 'uuid-griefer-003',
        username: 'xGrieferx',
        status: 'BANNED',
        vipRank: 'NONE',
        totalPlaytime: 120,
        firstJoin: new Date('2026-03-01'),
        lastSeen: new Date('2026-03-02'),
      },
    }),
  ])
  console.log('Created players:', players.map(p => p.username))

  // Ticket
  await prisma.ticket.upsert({
    where: { ticketNumber: 1 },
    update: {},
    create: {
      ticketNumber: 1,
      subject: 'Problém s VIP rankem',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'PURCHASE_ISSUE',
      playerId: players[0].id,
      replies: {
        create: {
          content: 'Dobrý den, zakoupil jsem VIP Premium ale rank mi nebyl přidělen.',
          playerId: players[0].id,
        },
      },
    },
  })

  // Server stats
  for (const server of ['SURVIVAL', 'SLIMEFUN', 'LOBBY'] as const) {
    await prisma.serverStat.create({
      data: {
        server,
        playerCount: Math.floor(Math.random() * 50) + 10,
        tps: 19.2 + Math.random() * 0.8,
        memoryUsed: 4096 + Math.floor(Math.random() * 2048),
        memoryTotal: 8192,
        cpuPercent: 20 + Math.random() * 30,
      },
    })
  }

  console.log('Seed complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
