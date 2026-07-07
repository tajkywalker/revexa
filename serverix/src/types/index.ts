import type {
  AdminUser, Player, Ticket, TicketReply, Report,
  Recruitment, Punishment, ServerStat, AuditLog,
  AdminRole, PlayerStatus, VipRank, TicketStatus,
  TicketPriority, TicketCategory, ReportStatus,
  ReportReason, RecruitmentStatus, RecruitmentPosition,
  PunishmentType, GameServer,
} from '@prisma/client'

// Re-export Prisma enums
export {
  AdminRole, PlayerStatus, VipRank, TicketStatus,
  TicketPriority, TicketCategory, ReportStatus,
  ReportReason, RecruitmentStatus, RecruitmentPosition,
  PunishmentType, GameServer,
}

// Extended types with relations
export type PlayerWithStats = Player & {
  _count: { tickets: number; reports: number; punishments: number }
  punishments: Punishment[]
}

export type TicketWithRelations = Ticket & {
  player: Pick<Player, 'id' | 'username' | 'hytaleUuid'>
  assignedTo: Pick<AdminUser, 'id' | 'username' | 'avatar'> | null
  replies: (TicketReply & {
    author: Pick<AdminUser, 'id' | 'username' | 'avatar'> | null
  })[]
}

export type ReportWithRelations = Report & {
  reportedBy: Pick<Player, 'id' | 'username'>
  targetPlayer: Pick<Player, 'id' | 'username' | 'status'>
  handledBy: Pick<AdminUser, 'id' | 'username'> | null
}

export type RecruitmentWithPlayer = Recruitment & {
  player: Pick<Player, 'id' | 'username' | 'hytaleUuid' | 'discordUsername'>
  reviewedBy: Pick<AdminUser, 'id' | 'username'> | null
}

// Dashboard stats
export interface DashboardStats {
  players: {
    total: number
    online: number
    newToday: number
    banned: number
  }
  tickets: {
    open: number
    inProgress: number
    resolvedToday: number
    urgent: number
  }
  reports: {
    pending: number
    resolvedToday: number
  }
  recruitments: {
    open: number
    underReview: number
  }
  revenue: {
    today: number
    thisMonth: number
    total: number
  }
  servers: ServerStatus[]
}

export interface ServerStatus {
  id:           GameServer
  name:         string
  online:       boolean
  players:      number
  maxPlayers:   number
  tps:          number
  memoryUsed:   number
  memoryTotal:  number
  cpuPercent:   number
  uptime:       number // seconds
}

// API response types
export type ApiResponse<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

export type PaginatedResponse<T> = {
  data:  T[]
  total: number
  page:  number
  limit: number
  pages: number
}

// NextAuth session extension
declare module 'next-auth' {
  interface Session {
    user: {
      id:       string
      username: string
      email:    string
      role:     AdminRole
      avatar:   string | null
    }
  }
}
