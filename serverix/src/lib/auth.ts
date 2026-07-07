import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import DiscordProvider from 'next-auth/providers/discord'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
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
        totp:     { label: '2FA Code', type: 'text' },
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

        // 2FA check
        if (admin.twoFactorEnabled && admin.twoFactorSecret) {
          if (!credentials.totp) return null
          // TODO: Ověřit TOTP pomocí otplib
          // const { authenticator } = await import('otplib')
          // if (!authenticator.verify({ token: credentials.totp, secret: admin.twoFactorSecret })) return null
        }

        // Update last login
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
    DiscordProvider({
      clientId:     process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
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
        session.user.id       = token.id as string
        ;(session.user as any).username = token.username
        ;(session.user as any).role     = token.role
        ;(session.user as any).avatar   = token.avatar
      }
      return session
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard') ||
                            request.nextUrl.pathname.startsWith('/players') ||
                            request.nextUrl.pathname.startsWith('/tickets') ||
                            request.nextUrl.pathname.startsWith('/reports') ||
                            request.nextUrl.pathname.startsWith('/recruitments') ||
                            request.nextUrl.pathname.startsWith('/server') ||
                            request.nextUrl.pathname.startsWith('/settings')
      if (isOnDashboard) return isLoggedIn
      return true
    },
  },
})
