import { NextAuthOptions } from 'next-auth'
// import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'

// We'll implement this when we set up Prisma
// import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || 'spektif-agency-secret-key-production-2024-hardcoded',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id-hardcoded',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret-hardcoded',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Use local emulators for development
          const apiUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:5001/spektif-agency-final-prod/europe-west4'
            : (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/spektif-agency-final-prod/europe-west4')
          console.log('🔐 NextAuth trying to login with API URL:', apiUrl)
          const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            return null
          }

          const data = await response.json()

          if (data.user && data.token) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              image: null,
              // Store additional data
              role: data.user.role || 'ADMIN', // Add role with fallback
              organizations: data.organizations || [],
              token: data.token,
              backendToken: data.user.backendToken || data.token
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/tr/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'ADMIN' // Add fallback
        token.organizations = (user as any).organizations
        token.backendToken = (user as any).token
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
        (session.user as any).organizations = token.organizations as any
        (session.user as any).backendToken = token.backendToken as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
}
