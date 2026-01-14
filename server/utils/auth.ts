import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { Resend } from 'resend'
import * as schema from '../database/schema'
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  changeEmailVerificationTemplate,
  changeEmailNotificationTemplate
} from './email-templates'

// Create a dedicated postgres client for auth
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  baseURL: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }: { user: { email: string, name: string }, url: string }) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Juros <onboarding@resend.dev>',
        to: user.email,
        subject: 'Redefinir palavra-passe - Juros',
        html: resetPasswordTemplate(user.name, url)
      })
    },
    async sendEmailVerification({ user, url }: { user: { email: string, name: string }, url: string }) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Juros <onboarding@resend.dev>',
        to: user.email,
        subject: 'Verifique o seu email - Juros',
        html: verifyEmailTemplate(user.name, url)
      })
    }
  },
  changeEmail: {
    enabled: true,
    async sendChangeEmailVerification({ user, newEmail, url }: { user: { email: string, name: string }, newEmail: string, url: string }) {
      // Send verification to the NEW email
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Juros <onboarding@resend.dev>',
        to: newEmail,
        subject: 'Confirme o seu novo email - Juros',
        html: changeEmailVerificationTemplate(user.name, newEmail, url)
      })

      // Notify the OLD email about the change request
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Juros <onboarding@resend.dev>',
        to: user.email,
        subject: 'Pedido de alteracao de email - Juros',
        html: changeEmailNotificationTemplate(user.name, newEmail)
      })
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },
  trustedOrigins: [
    'http://localhost:3000',
    'https://juros.amortizacao.com'
  ]
})

export type Auth = typeof auth
