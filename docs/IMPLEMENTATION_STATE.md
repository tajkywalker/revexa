# Aunaria Platform — Implementation State

**Date:** 2026-08-17  
**Branch:** session/agent_df418f7b-a7cc-459e-875d-6c8a096b8dbf

---

## Architecture

Two Next.js 15 apps sharing one PostgreSQL database via Prisma:

```
serverix/   → staff.aunaria.net   (port 3000)
aunaria/    → www.aunaria.net     (port 3001)
```

Shared DB schema: `serverix/prisma/schema.prisma`

---

## ✅ Implemented & Functional (Serverix)

### Auth
- NextAuth JWT credentials (bcrypt, AdminUser model)
- Session-based protection of all dashboard routes

### RBAC / Permissions
- `serverix/src/lib/permissions.ts`
- 6 roles: OWNER > ADMIN > MODERATOR > DEVELOPER > HELPER > BUILDER
- Full permission set (players.*, moderation.*, tickets.*, servers.*, audit.*, ai.*, roles.*, settings.*)
- Server-side enforcement on all pages and API routes
- `requirePermission()`, `checkPermission()`, `hasPermission()` helpers

### Dashboard (`/dashboard`)
- KPI cards: players, tickets, reports, revenue
- Server status hero (real data from `server_stats`)
- Recent activity feeds: tickets, punishments, recruitments

### Players (`/players`, `/players/[id]`)
- Full searchable/filterable player list
- Player detail: profile, stats, game stats per server, punishments, tickets, transactions
- **Staff notes** (permission-gated, internal only, not exposed to player web)
- IP history (OWNER/ADMIN/MODERATOR only)
- Ban/unban from detail page

### Moderation (`/moderation`)  ← NEW
- Punishment list with filters (type, active, search)
- Active punishment count cards per type
- `PunishmentForm` component for issuing punishments
- API: `POST /api/moderation` with permission checks + audit

### Audit Log (`/audit`)  ← NEW
- Full audit log table with search/filter
- Paginated, sortable by time

### Tickets (`/tickets`, `/tickets/[id]`)
- Full ticket management: list, detail, reply, assign, close, resolve
- Internal staff notes (hidden from player web)
- Priority + status indicators

### Reports (`/reports`)
- Report list with filters

### Recruitments (`/recruitments`, `/recruitments/[id]`)  ← NEW DETAIL
- `RecruitmentActions` component: Accept/Reject/Under Review with notes
- API: `PATCH /api/recruitments/[id]`

### Server Management (`/server`, `/server/[id]`)  ← NEW DETAIL
- Server overview with links to detail pages
- Server detail: stats, console, recent commands
- **Console** (`ServerConsole` component): mock mode, command history, audit logging
- API: `POST /api/server/[id]/console` with `servers.console.execute` permission check
- All console commands are audited

### Settings (`/settings`)  ← NEW
- Profile display, password change
- AI config panel (mode, cost tracking)

### AI Abstraction Layer  ← NEW
- `serverix/src/lib/ai.ts`
- Modes: `mock` (default) | `live`
- Safety switch: `AI_PAID_REQUESTS_ENABLED=false` (default) — throws if live called without enabling
- Mock responses for: ticket classification, reply suggestions, player risk score
- All executions recorded in `AIUsage` table
- Helpers: `classifyTicket()`, `suggestTicketReply()`, `getPlayerRiskScore()`

### Notifications
- Model: `Notification` in schema
- API: `GET/PATCH /api/notifications`
- Not yet surfaced in the UI (bell in Header exists but not wired)

---

## ✅ Implemented (Aunaria Player Web)

Location: `aunaria/`

### Pages
- `/` — Landing page: hero, server browser, features, CTA
- `/servers` — Full server browser with live stats + details
- `/profile/[username]` — Player profile (public, privacy-respecting)
- `/tickets` — Player's own tickets list (requires login)
- `/tickets/new` — Create ticket form
- `/login` — Player login (separate from Serverix admin auth)

### Components
- `Navbar` — responsive with auth state
- `Footer` — links and branding
- `NewTicketForm` — category/priority selection, POST to API
- `Providers` — SessionProvider wrapper

### API
- `POST /api/tickets` — create ticket with auth check
- `GET/POST /api/auth/[...nextauth]` — player auth

---

## ✅ Schema Extensions

New models added:
- `Notification` (with `NotificationType` enum)
- `AIUsage`

Updated models:
- `Punishment` — added `evidence[]`, `revokedReason`
- `AdminUser` — added `playerNotes`, `notifications` relations
- `PlayerNote` — added `author` relation

---

## ❌ Mocked / Not Production-Ready

| Feature | State |
|---------|-------|
| Server console | MOCK — needs game server WebSocket/RCON bridge |
| AI live calls | MOCK — `AI_MODE=mock`, no provider wired |
| Player auth | Demo only — needs bcrypt password field on Player |
| Notification bell UI | Model + API exists, not wired to Header |
| Real-time server stats | Polling model only, no WebSocket |
| Discord OAuth | Env vars defined, not implemented |
| Email notifications | Architecture ready, no provider |
| Community feed/posts | Not started |
| Friends system | Not started |
| Announcements | Model exists, no UI |

---

## 🚀 Deployment

### Serverix (currently deployed at 167.233.233.156:3000 via PM2)

```bash
cd /var/www/serverix
git pull
# After schema changes:
npx prisma migrate dev   # or db push for dev
npx prisma db seed
npm run build
pm2 restart serverix
```

Required `.env.local`:
```
DATABASE_URL=postgresql://...
AUTH_SECRET=<32+ char secret>
AI_MODE=mock
AI_PAID_REQUESTS_ENABLED=false
```

### Aunaria Player Web (not yet deployed)

```bash
# On server:
cd /var/www
git clone ... aunaria
cd aunaria
npm install
# Copy .env.local from serverix (same DB)
npm run build
pm2 start npm --name "aunaria" -- start
```

Nginx config needed for `www.aunaria.net` → port 3001

---

## ⬆️ Next Priority Work

1. **Wire notification bell in Serverix Header** — fetch `/api/notifications`, show unread count
2. **Aunaria: ticket detail page** — `/tickets/[id]` for players to reply to their tickets
3. **Aunaria: player registration** — needs `passwordHash` field on Player model + registration form
4. **Serverix: moderation revoke** — "Zrušit trest" button with `revokedReason` field
5. **Serverix: audit log on ban revocation** — already structured, needs `revoke` API endpoint
6. **Community feed** — `Post`, `Comment`, `Reaction` models + pages
7. **AI ticket classification** — wire `classifyTicket()` into ticket creation flow
8. **Serverix: AI panel** — `/ai` page for ticket summaries, player risk, usage costs
9. **Nginx reverse proxy** setup for both domains
10. **Real-time server stats** — WebSocket endpoint or SSE for live dashboard updates
