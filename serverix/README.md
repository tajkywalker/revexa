# Serverix — Aunaria Admin Platform

> Hytale server management platform replacing Discord moderation + Pterodactyl · Walker Crew Studio

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?style=flat-square&logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org)

Serverix is a full-stack admin panel for the Aunaria Hytale server. It unifies player management, support tickets, reports, team recruitment, and server monitoring into a single dark-themed platform.

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Live KPIs, player growth charts, recent activity feed |
| **Players** | Full player profiles, ban/unban, punishment history, game stats per server |
| **Tickets** | Threaded support tickets with internal notes, priority system, auto-assignment |
| **Reports** | Player reports with evidence, multi-stage review workflow |
| **Recruitments** | Team application management (Moderator, Builder, Developer...) |
| **Server** | Real-time TPS, RAM, CPU monitoring per game server |
| **Auth** | Admin credentials + Discord OAuth + 2FA (TOTP) |
| **Audit Log** | Every admin action tracked with IP and timestamp |

## Tech Stack

- **Next.js 15** — App Router, Server Components, Server Actions
- **TypeScript** — strict mode throughout
- **Prisma 6** — PostgreSQL ORM
- **NextAuth v5** — JWT sessions, Discord provider
- **Recharts** — player growth charts
- **Tailwind CSS 3** — custom dark design system
- **Radix UI** — accessible headless components
- **bcryptjs** — password hashing

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/tajkywalker/aunaria-serverix
cd aunaria-serverix
npm install

# 2. Setup environment
cp .env.example .env
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET

# 3. Setup database
npm run db:push    # Create tables
npm run db:seed    # Seed test data (admin / admin123)

# 4. Start development
npm run dev
# → http://localhost:3000
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32-byte secret (`openssl rand -base64 32`) |
| `DISCORD_CLIENT_ID` | Discord OAuth app client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth app client secret |
| `HYTALE_RCON_PASSWORD` | Hytale server RCON password (for live commands) |

## Project Structure

```
serverix/
├── prisma/
│   ├── schema.prisma       13 models, 10 enums
│   └── seed.ts             Test data
├── src/
│   ├── app/
│   │   ├── (auth)/         Login page
│   │   ├── (dashboard)/    All admin pages
│   │   └── api/            REST endpoints
│   ├── components/
│   │   ├── layout/         Sidebar, Header
│   │   ├── players/        BanPlayerButton, etc.
│   │   ├── tickets/        ReplyForm, TicketActions
│   │   └── charts/         PlayerGrowthChart
│   ├── lib/                prisma.ts, auth.ts, utils.ts
│   └── types/              Global TypeScript types
└── .env.example
```

## Database Schema

```
AdminUser ─── AdminSession
           ─── AuditLog
           ─── TicketReply
Player ──── Punishment
        ─── Ticket ──── TicketReply
        ─── Report
        ─── Recruitment
        ─── Transaction
        ─── PlayerGameStat
ServerStat
Announcement
```

## Deployment

```bash
# Build
npm run build

# Docker (recommended)
docker build -t serverix .
docker run -p 3000:3000 --env-file .env serverix
```

## Default Admin

After running `npm run db:seed`:
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** OWNER

> Change the password immediately after first login.

---

*© 2026 Walker Crew Studio. Not affiliated with Hypixel Studios.*
