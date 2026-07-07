import type { Metadata } from 'next'
import { Roboto, Oswald } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
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
  title: { default: 'Serverix — Aunaria Admin', template: '%s | Serverix' },
  description: 'Aunaria Hytale Server Admin Platform by Walker Crew Studio',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <body className={`${roboto.variable} ${oswald.variable} bg-void text-gray-100`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0f0f20',
              color: '#eeeef8',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#3ecf8e', secondary: '#0f0f20' } },
            error:   { iconTheme: { primary: '#e05252', secondary: '#0f0f20' } },
          }}
        />
      </body>
    </html>
  )
}
