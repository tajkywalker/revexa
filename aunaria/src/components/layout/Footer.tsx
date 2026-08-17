import Link from 'next/link'
import { Shield } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="font-title font-bold text-white tracking-widest uppercase">AUNARIA</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Next Generation Hytale Experience. Walker Crew Studio.
            </p>
          </div>

          {/* Community */}
          <div>
            <p className="text-xs font-title font-semibold text-gray-500 uppercase tracking-widest mb-3">Komunita</p>
            <div className="space-y-2">
              <FooterLink href="/servers">Servery</FooterLink>
              <FooterLink href="/profile">Profil</FooterLink>
              <FooterLink href="/tickets">Podpora</FooterLink>
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-title font-semibold text-gray-500 uppercase tracking-widest mb-3">Informace</p>
            <div className="space-y-2">
              <FooterLink href="/wiki">Wiki</FooterLink>
              <FooterLink href="/updates">Update Log</FooterLink>
              <FooterLink href="/store">Obchod</FooterLink>
            </div>
          </div>

          {/* Support */}
          <div>
            <p className="text-xs font-title font-semibold text-gray-500 uppercase tracking-widest mb-3">Podpora</p>
            <div className="space-y-2">
              <FooterLink href="/tickets">Tickety</FooterLink>
              <FooterLink href="/tickets?category=BAN_APPEAL">Ban Appeal</FooterLink>
              <FooterLink href="/tickets?category=BUG_REPORT">Bug Report</FooterLink>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 font-title tracking-widest">
            © {new Date().getFullYear()} AUNARIA — WALKER CREW STUDIO
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-700">play.aunaria.net</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="text-xs text-gray-700">staff.aunaria.net</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">
      {children}
    </Link>
  )
}
