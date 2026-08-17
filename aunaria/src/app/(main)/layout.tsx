import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Providers } from '@/components/layout/Providers'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
