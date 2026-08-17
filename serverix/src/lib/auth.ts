import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No adapter — pure JWT strategy
  trustHost: true,   // allow IP access (167.233.233.156), fixes UntrustedHost error
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn:  '/login',
    signOut: '/login',
    error:   '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const admin = await prisma.adminUser.findUnique({
          where: { username: credentials.username as string },
        })

        if (!admin || !admin.isActive) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          admin.password
        )
        if (!valid) return null

        // Update last login timestamp
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLogin: new Date() },
        })

        return {
          id:       admin.id,
          username: admin.username,
          email:    admin.email,
          role:     admin.role,
          avatar:   admin.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id
        token.username = (user as any).username
        token.role     = (user as any).role
        token.avatar   = (user as any).avatar
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id               = token.id as string
        ;(session.user as any).username = token.username
        ;(session.user as any).role     = token.role
        ;(session.user as any).avatar   = token.avatar
      }
      return session
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl
      const isProtected =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/players') ||
        pathname.startsWith('/tickets') ||
        pathname.startsWith('/reports') ||
        pathname.startsWith('/recruitments') ||
        pathname.startsWith('/moderation') ||
        pathname.startsWith('/audit') ||
        pathname.startsWith('/server') ||
        pathname.startsWith('/settings')
      if (isProtected) return isLoggedIn
      return true
    },
  },
})
