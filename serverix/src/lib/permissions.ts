// ─── Permission System ────────────────────────────────
// RBAC for Serverix staff roles.
// All enforcement must happen server-side.

import { AdminRole } from '@prisma/client'
import { auth } from './auth'
import { redirect } from 'next/navigation'

// ─── Permission definitions ────────────────────────────

export type Permission =
  | 'dashboard.view'
  | 'players.view'
  | 'players.notes.view'
  | 'players.notes.create'
  | 'players.ip.view'
  | 'moderation.view'
  | 'moderation.warn'
  | 'moderation.mute'
  | 'moderation.kick'
  | 'moderation.ban'
  | 'moderation.unban'
  | 'moderation.tempban'
  | 'tickets.view'
  | 'tickets.assign'
  | 'tickets.reply'
  | 'tickets.internal_notes'
  | 'tickets.close'
  | 'tickets.resolve'
  | 'reports.view'
  | 'reports.handle'
  | 'recruitments.view'
  | 'recruitments.review'
  | 'servers.view'
  | 'servers.console.view'
  | 'servers.console.execute'
  | 'servers.restart'
  | 'settings.view'
  | 'settings.manage'
  | 'audit.view'
  | 'roles.view'
  | 'roles.manage'
  | 'ai.view'
  | 'ai.manage'

// ─── Role → Permission mapping ────────────────────────

const ROLE_PERMISSIONS: Record<AdminRole, Set<Permission>> = {
  HELPER: new Set([
    'dashboard.view', 'players.view', 'players.notes.view',
    'tickets.view', 'tickets.reply', 'tickets.resolve',
    'reports.view',
    'servers.view',
  ]),
  BUILDER: new Set([
    'dashboard.view', 'players.view',
    'tickets.view',
    'servers.view',
  ]),
  DEVELOPER: new Set([
    'dashboard.view', 'players.view', 'players.notes.view', 'players.notes.create',
    'tickets.view', 'tickets.assign', 'tickets.reply', 'tickets.internal_notes', 'tickets.close', 'tickets.resolve',
    'reports.view', 'reports.handle',
    'servers.view', 'servers.console.view', 'servers.console.execute', 'servers.restart',
    'settings.view',
    'audit.view',
    'ai.view',
  ]),
  MODERATOR: new Set([
    'dashboard.view',
    'players.view', 'players.notes.view', 'players.notes.create', 'players.ip.view',
    'moderation.view', 'moderation.warn', 'moderation.mute', 'moderation.kick', 'moderation.ban', 'moderation.unban', 'moderation.tempban',
    'tickets.view', 'tickets.assign', 'tickets.reply', 'tickets.internal_notes', 'tickets.close', 'tickets.resolve',
    'reports.view', 'reports.handle',
    'recruitments.view',
    'servers.view',
    'audit.view',
  ]),
  ADMIN: new Set([
    'dashboard.view',
    'players.view', 'players.notes.view', 'players.notes.create', 'players.ip.view',
    'moderation.view', 'moderation.warn', 'moderation.mute', 'moderation.kick', 'moderation.ban', 'moderation.unban', 'moderation.tempban',
    'tickets.view', 'tickets.assign', 'tickets.reply', 'tickets.internal_notes', 'tickets.close', 'tickets.resolve',
    'reports.view', 'reports.handle',
    'recruitments.view', 'recruitments.review',
    'servers.view', 'servers.console.view', 'servers.console.execute', 'servers.restart',
    'settings.view', 'settings.manage',
    'audit.view',
    'roles.view', 'roles.manage',
    'ai.view', 'ai.manage',
  ]),
  OWNER: new Set([
    'dashboard.view',
    'players.view', 'players.notes.view', 'players.notes.create', 'players.ip.view',
    'moderation.view', 'moderation.warn', 'moderation.mute', 'moderation.kick', 'moderation.ban', 'moderation.unban', 'moderation.tempban',
    'tickets.view', 'tickets.assign', 'tickets.reply', 'tickets.internal_notes', 'tickets.close', 'tickets.resolve',
    'reports.view', 'reports.handle',
    'recruitments.view', 'recruitments.review',
    'servers.view', 'servers.console.view', 'servers.console.execute', 'servers.restart',
    'settings.view', 'settings.manage',
    'audit.view',
    'roles.view', 'roles.manage',
    'ai.view', 'ai.manage',
  ]),
}

// ─── Helpers ──────────────────────────────────────────

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as AdminRole]
  if (!perms) return false
  return perms.has(permission)
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/** Server component: get session or redirect to login */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session
}

/** Server component: require specific permission or redirect */
export async function requirePermission(permission: Permission) {
  const session = await requireAuth()
  const role = (session.user as any).role ?? 'HELPER'
  if (!hasPermission(role, permission)) redirect('/dashboard?error=forbidden')
  return session
}

/** Used in API routes — returns false instead of redirecting */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  const role = (session.user as any).role ?? 'HELPER'
  return hasPermission(role, permission)
}
