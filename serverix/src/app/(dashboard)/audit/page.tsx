import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { formatRelative } from '@/lib/utils'
import Link from 'next/link'
import { Activity, Search, Filter, Shield, User } from 'lucide-react'

export const metadata = { title: 'Audit Log' }
export const dynamic = 'force-dynamic'

interface SearchParams { action?: string; admin?: string; page?: string }

export default async function AuditPage({ searchParams: _sp }: { searchParams: Promise<SearchParams> }) {
  const sp = await _sp
  await requirePermission('audit.view')

  const page  = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 40
  const skip  = (page - 1) * limit

  const where: any = {}
  if (sp.action) where.action = { contains: sp.action, mode: 'insensitive' }
  if (sp.admin)  where.admin  = { username: { contains: sp.admin, mode: 'insensitive' } }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { username: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Action color mapping
  function getActionColor(action: string) {
    if (action.startsWith('PUNISHMENT_BAN'))   return 'text-red bg-red/10 border-red/20'
    if (action.startsWith('PUNISHMENT_'))      return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    if (action.startsWith('TICKET_'))          return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    if (action.startsWith('LOGIN'))            return 'text-green bg-green/10 border-green/20'
    if (action.startsWith('CONSOLE_'))         return 'text-accent bg-accent/10 border-accent/20'
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div>
        <h1 className="text-xl font-title font-bold text-white tracking-wide">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total.toLocaleString()} zaznamenaných akcí
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3" method="GET">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input name="action" defaultValue={sp.action} placeholder="Akce (PUNISHMENT_BAN, TICKET_...)" className="sx-input pl-9" />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input name="admin" defaultValue={sp.admin} placeholder="Admin..." className="sx-input pl-9" />
        </div>
        <button type="submit" className="sx-btn-primary">
          <Filter className="w-4 h-4" />
          Filtrovat
        </button>
      </form>

      {/* Log table */}
      <div className="sx-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Čas</th>
                <th>Admin</th>
                <th>Akce</th>
                <th>Cíl</th>
                <th>Detail</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Žádné záznamy
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{formatRelative(log.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        <span className="text-sm text-gray-300">{log.admin.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sx-badge text-xs font-mono ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500 font-mono">
                      {log.target ? (
                        log.target.startsWith('cm') ? (
                          <span className="truncate max-w-[120px] block">{log.target}</span>
                        ) : (
                          <span>{log.target}</span>
                        )
                      ) : '—'}
                    </td>
                    <td className="text-xs text-gray-600 max-w-[200px]">
                      {log.details ? (
                        <span className="truncate block" title={JSON.stringify(log.details)}>
                          {typeof log.details === 'object'
                            ? Object.entries(log.details as Record<string,unknown>)
                                .filter(([k]) => k !== 'punishmentId')
                                .slice(0,2)
                                .map(([k,v]) => `${k}=${v}`)
                                .join(' · ')
                            : String(log.details)
                          }
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-xs text-gray-600 font-mono">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
            <p className="text-xs text-gray-500">Strana {page} z {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/audit?page=${page - 1}${sp.action ? `&action=${sp.action}` : ''}`}
                  className="sx-btn-secondary text-xs py-1 px-3">← Předchozí</Link>
              )}
              {page < totalPages && (
                <Link href={`/audit?page=${page + 1}${sp.action ? `&action=${sp.action}` : ''}`}
                  className="sx-btn-secondary text-xs py-1 px-3">Další →</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
