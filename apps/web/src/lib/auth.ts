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
          // Use Firebase Functions in production, local API in development
          const firebaseUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://europe-west4-spektif-agency-final-prod.cloudfunctions.net'
          const localUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          const apiUrl = process.env.NODE_ENV === 'production' ? firebaseUrl : localUrl
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
        token.organizations = (user as any).organizations
        token.backendToken = (user as any).token
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id as string
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
