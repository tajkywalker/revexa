import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Fetch badge counts
  const [openTickets, pendingReports, openRecruitments, activePunishments] = await Promise.all([
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.recruitment.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    prisma.punishment.count({ where: { isActive: true, createdAt: { gte: new Date(Date.now() - 86400000) } } }),
  ])

  return (
    <div className="min-h-screen bg-void">
      <Sidebar
        user={{
          username: (session.user as any).username ?? session.user.email ?? 'Admin',
          role:     (session.user as any).role ?? 'HELPER',
          avatar:   (session.user as any).avatar ?? null,
        }}
        badges={{
          tickets:      openTickets,
          reports:      pendingReports,
          recruitments: openRecruitments,
          moderation:   activePunishments,
        }}
      />

      {/* Main area */}
      <div className="ml-60 flex flex-col min-h-screen">
        <Header notificationCount={openTickets + pendingReports} />
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
        <footer className="px-6 py-3 border-t border-white/[0.04]">
          <p className="text-xs text-gray-700 font-title tracking-widest">
            SERVERIX v1.0 — WALKER CREW STUDIO © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  )
}
