// Aunaria Player Auth
// Players authenticate with their Hytale username + email
// This is separate from Serverix (admin) auth
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn:  '/login',
    signOut: '/login',
    error:   '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Aunaria Account',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const player = await prisma.player.findFirst({
          where: { username: { equals: credentials.username as string, mode: 'insensitive' } },
        })

        if (!player) return null
        if (player.status === 'BANNED') return null

        // Players may not have passwords yet (Hytale integration pending)
        // Check if player has a passwordHash (stored in bio field as JSON temporarily)
        // TODO: add proper password field to Player model
        // For now, use email as a simple check for demo
        if (!player.email) return null

        // Demo: accept if email matches password (not production!)
        // Production would use bcrypt hash in a dedicated field
        const validEmail = player.email === (credentials.password as string)
        if (!validEmail) return null

        return {
          id:       player.id,
          name:     player.username,
          email:    player.email,
          image:    `https://minotar.net/avatar/${player.username}/64`,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id
        token.username = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string;
        (session.user as any).username = token.username
      }
      return session
    },
  },
})
