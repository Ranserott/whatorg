import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { NextAuthConfig } from 'next-auth'
import { prisma } from '@/lib/prisma'

console.log('[AUTH INIT] Loading auth configuration...')
console.log('[AUTH INIT] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  // Allow all hosts in production (required for Dokploy/Traefik)
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.log('[AUTH] Missing username or password')
          return null
        }

        console.log('[AUTH] Attempting login for user:', credentials.username)

        try {
          // Find user by username
          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username as string
            }
          })

          if (!user) {
            console.log('[AUTH] User not found:', credentials.username)
            return null
          }

          // Check if user is active
          if (!user.isActive) {
            console.log('[AUTH] User is inactive:', credentials.username)
            return null
          }

          // Verify password
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isValid) {
            console.log('[AUTH] Invalid password for user:', credentials.username)
            return null
          }

          console.log('[AUTH] Authentication successful for user:', credentials.username)

          return {
            id: user.id,
            name: user.name || user.username,
            email: user.username, // Using username as email for NextAuth
            username: user.username,
            role: user.role,
          }
        } catch (error) {
          console.error('[AUTH] Error during authentication:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }

  interface User {
    username: string
    role: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
})
