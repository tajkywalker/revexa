import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { NewTicketForm } from '@/components/community/NewTicketForm'

export const metadata = { title: 'Nový ticket' }

export default async function NewTicketPage({ searchParams: _sp }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await _sp
  const session = await auth()
  if (!session?.user) redirect('/login?redirect=/tickets/new')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-title font-bold text-white">Nový ticket</h1>
        <p className="text-sm text-gray-500 mt-1">Popište svůj problém a náš tým vám pomůže.</p>
      </div>
      <NewTicketForm defaultCategory={sp.category} playerId={session.user.id} />
    </div>
  )
}
