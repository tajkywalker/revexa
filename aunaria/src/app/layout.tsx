import type { Metadata } from 'next'
import { Roboto, Oswald } from 'next/font/google'
import './globals.css'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

const oswald = Oswald({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Aunaria',
    default:  'Aunaria — Next Generation Hytale Experience',
  },
  description: 'Aunaria — Next-generation Hytale server community. Survival, Slimefun 2.0, Skyblock, and more.',
  keywords: ['Aunaria', 'Hytale', 'server', 'community', 'Slimefun', 'Survival'],
  openGraph: {
    title:       'Aunaria',
    description: 'Next Generation Hytale Experience',
    type:        'website',
    url:         'https://aunaria.net',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <body className={`${roboto.variable} ${oswald.variable}`}>
        {children}
      </body>
    </html>
  )
}
