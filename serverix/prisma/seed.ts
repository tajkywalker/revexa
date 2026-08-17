import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Serverix database...')

  const hashedPwd = await bcrypt.hash('admin123', 12)
  const modPwd    = await bcrypt.hash('mod123', 12)

  // ─── Admin users ────────────────────────────────────
  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', email: 'admin@aunaria.net', password: hashedPwd, role: 'OWNER', isActive: true },
  })
  const mod = await prisma.adminUser.upsert({
    where: { username: 'moderator' },
    update: {},
    create: { username: 'moderator', email: 'mod@aunaria.net', password: modPwd, role: 'MODERATOR', isActive: true },
  })
  console.log('Created admins:', admin.username, mod.username)

  // ─── Players ────────────────────────────────────────
  const players = await Promise.all([
    prisma.player.upsert({
      where: { hytaleUuid: 'uuid-tajkunek-001' },
      update: {},
      create: {
        hytaleUuid: 'uuid-tajkunek-001', username: 'Tajkunek', status: 'ACTIVE', vipRank: 'VIP_3',
        totalPlaytime: 14700, totalVotes: 156, totalSpent: 2450, balance: 15600,
        discordUsername: 'Tajkunek#0001', email: 'tajky@example.com',
        firstJoin: new Date('2026-01-15'), lastSeen: new Date(),
        bio: 'I love Hytale. Founder of Aunaria.',
      },
    }),
    prisma.player.upsert({
      where: { hytaleUuid: 'uuid-steve-002' },
      update: {},
      create: {
        hytaleUuid: 'uuid-steve-002', username: 'SteveBuilder', status: 'ACTIVE', vipRank: 'VIP_1',
        totalPlaytime: 3420, totalVotes: 48, email: 'steve@example.com',
        firstJoin: new Date('2026-02-10'), lastSeen: new Date(Date.now() - 86400000),
      },
    }),
    prisma.player.upsert({
      where: { hytaleUuid: 'uuid-griefer-003' },
      update: {},
      create: {
        hytaleUuid: 'uuid-griefer-003', username: 'xGrieferx', status: 'BANNED', vipRank: 'NONE',
        totalPlaytime: 120, firstJoin: new Date('2026-03-01'), lastSeen: new Date('2026-03-02'),
        lastIpAddress: '192.168.1.100',
      },
    }),
    prisma.player.upsert({
      where: { hytaleUuid: 'uuid-builder-004' },
      update: {},
      create: {
        hytaleUuid: 'uuid-builder-004', username: 'CraftMaster99', status: 'ACTIVE', vipRank: 'VIP_2',
        totalPlaytime: 7200, totalVotes: 89, email: 'craft@example.com',
        firstJoin: new Date('2026-01-20'), lastSeen: new Date(Date.now() - 3600000),
        bio: 'Best builder on Aunaria!',
      },
    }),
    prisma.player.upsert({
      where: { hytaleUuid: 'uuid-newbie-005' },
      update: {},
      create: {
        hytaleUuid: 'uuid-newbie-005', username: 'NewPlayer2026', status: 'ACTIVE', vipRank: 'NONE',
        totalPlaytime: 45, firstJoin: new Date('2026-08-15'), lastSeen: new Date(),
      },
    }),
  ])
  console.log('Created players:', players.map(p => p.username))

  // ─── Game stats ─────────────────────────────────────
  for (const [player, server, playtime, kills, deaths] of [
    [players[0], 'SURVIVAL',  8000, 1200, 340],
    [players[0], 'SLIMEFUN',  4000, 0,    50],
    [players[1], 'SURVIVAL',  2000, 450,  200],
    [players[3], 'CREATIVE',  5000, 0,    0],
    [players[3], 'SURVIVAL',  2000, 300,  120],
  ] as const) {
    await prisma.playerGameStat.upsert({
      where: { playerId_server: { playerId: (player as any).id, server: server as any } },
      update: { playtime: playtime as any, kills: kills as any, deaths: deaths as any },
      create: {
        playerId: (player as any).id, server: server as any,
        playtime: playtime as any, kills: kills as any, deaths: deaths as any,
        blocksPlaced: Math.floor(Math.random() * 50000),
        blocksBroken: Math.floor(Math.random() * 30000),
      },
    })
  }

  // ─── Punishments ────────────────────────────────────
  const existingBan = await prisma.punishment.findFirst({ where: { playerId: players[2].id, type: 'BAN' } })
  if (!existingBan) {
    await prisma.punishment.create({
      data: {
        playerId: players[2].id, type: 'BAN', reason: 'Griefing a přátelský oheň na survival serveru',
        issuedById: mod.id, isActive: true,
      },
    })
    await prisma.punishment.create({
      data: {
        playerId: players[2].id, type: 'WARN', reason: 'První varování za nevhodné chování v chatu',
        issuedById: mod.id, isActive: false,
      },
    })
  }

  // ─── Staff note ─────────────────────────────────────
  const existingNote = await prisma.playerNote.findFirst({ where: { playerId: players[2].id } })
  if (!existingNote) {
    await prisma.playerNote.create({
      data: {
        playerId: players[2].id,
        content: 'Hráč byl opakovaně varován za griefing. Druhý ban během 2 týdnů. Zvýšit dohled.',
        authorId: mod.id,
      },
    })
  }

  // ─── Tickets ────────────────────────────────────────
  const t1 = await prisma.ticket.upsert({
    where: { ticketNumber: 1 },
    update: {},
    create: {
      ticketNumber: 1, subject: 'Problém s VIP rankem', status: 'OPEN', priority: 'HIGH',
      category: 'PURCHASE_ISSUE', playerId: players[0].id,
      replies: {
        create: { content: 'Dobrý den, zakoupil jsem VIP Premium ale rank mi nebyl přidělen. Číslo transakce: TXN-2026-001.', playerId: players[0].id },
      },
    },
  })
  const t2 = await prisma.ticket.upsert({
    where: { ticketNumber: 2 },
    update: {},
    create: {
      ticketNumber: 2, subject: 'Griefing na mém poli', status: 'IN_PROGRESS', priority: 'MEDIUM',
      category: 'GRIEF_REPORT', playerId: players[1].id, assignedToId: mod.id,
      replies: {
        create: { content: 'Někdo mi zničil celé pšeničné pole na souřadnicích 100, 64, 200 na Survival serveru.', playerId: players[1].id },
      },
    },
  })
  const t3 = await prisma.ticket.upsert({
    where: { ticketNumber: 3 },
    update: {},
    create: {
      ticketNumber: 3, subject: 'Bug: Slimefun reaktor exploduje', status: 'OPEN', priority: 'URGENT',
      category: 'BUG_REPORT', playerId: players[3].id,
      replies: {
        create: { content: 'Nukleární reaktor v Slimefun 2.0 exploduje bez varování při výkonu nad 75%. Ztratil jsem vše.', playerId: players[3].id },
      },
    },
  })
  console.log('Created tickets:', t1.ticketNumber, t2.ticketNumber, t3.ticketNumber)

  // ─── Reports ────────────────────────────────────────
  const existingReport = await prisma.report.findFirst({ where: { reportedById: players[1].id } })
  if (!existingReport) {
    await prisma.report.create({
      data: {
        reason: 'GRIEFING', description: 'Hráč xGrieferx zničil moje stavby na souřadnicích X:100 Z:200.',
        reportedById: players[1].id, targetPlayerId: players[2].id,
        server: 'SURVIVAL', status: 'RESOLVED', handledById: mod.id, handledAt: new Date(),
        resolution: 'Hráč byl permanentně zabanován.',
      },
    })
  }

  // ─── Recruitments ───────────────────────────────────
  const existingRec = await prisma.recruitment.findFirst({ where: { playerId: players[3].id } })
  if (!existingRec) {
    await prisma.recruitment.create({
      data: {
        position: 'BUILDER', status: 'OPEN',
        playerId: players[3].id,
        age: 19, timezone: 'CET', languages: ['cs', 'en'],
        experience: 'Stavím přes 3 roky. Portfolio: imgur.com/example. Specializuji se na fantasy architekturu.',
        motivation: 'Aunaria je nejlepší server co znám. Chci pomoci vytvořit úžasný herní svět.',
        availability: '15-20h/week',
        extraInfo: 'Umím pracovat v týmu a rychle se učím nové věci.',
      },
    })
  }

  // ─── Transactions ───────────────────────────────────
  const existingTx = await prisma.transaction.findFirst({ where: { playerId: players[0].id } })
  if (!existingTx) {
    await prisma.transaction.createMany({
      data: [
        { playerId: players[0].id, amount: 19.99, description: 'VIP Premium rank', status: 'completed' },
        { playerId: players[0].id, amount: 9.99,  description: 'Coin pack 1000',   status: 'completed' },
        { playerId: players[3].id, amount: 14.99, description: 'VIP+ upgrade',     status: 'completed' },
      ],
    })
  }

  // ─── Server stats ───────────────────────────────────
  for (const [server, players_, tps, memUsed] of [
    ['SURVIVAL',  47, 19.2, 5120],
    ['SLIMEFUN',  23, 18.9, 6144],
    ['LOBBY',     12, 19.8, 2048],
    ['CREATIVE',   8, 19.5, 3072],
  ] as const) {
    await prisma.serverStat.create({
      data: {
        server: server as any,
        playerCount: players_ + Math.floor(Math.random() * 5),
        tps: tps + Math.random() * 0.5,
        memoryUsed: memUsed + Math.floor(Math.random() * 512),
        memoryTotal: 8192,
        cpuPercent: 20 + Math.random() * 25,
      },
    })
  }

  // ─── Audit log ──────────────────────────────────────
  const existingAudit = await prisma.auditLog.findFirst({ where: { adminId: admin.id } })
  if (!existingAudit) {
    await prisma.auditLog.createMany({
      data: [
        { adminId: admin.id,  action: 'LOGIN',              details: { ip: '127.0.0.1' } },
        { adminId: mod.id,    action: 'PUNISHMENT_BAN',     target: players[2].id, details: { username: 'xGrieferx', reason: 'Griefing' } },
        { adminId: mod.id,    action: 'TICKET_ASSIGNED',    target: t2.id, details: { ticketNumber: 2 } },
        { adminId: admin.id,  action: 'RECRUITMENT_REVIEW', target: 'rec-1', details: {} },
      ],
    })
  }

  console.log('Seed complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
