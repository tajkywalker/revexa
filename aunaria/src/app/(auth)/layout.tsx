import { Providers } from '@/components/layout/Providers'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
