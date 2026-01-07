import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { Resend } from 'resend'
import * as schema from '../database/schema'

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
    async sendResetPassword(data: any, request?: Request) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Juros <onboarding@resend.dev>',
        to: data.user.email,
        subject: 'Redefinir palavra-passe - Juros',
        html: `<p>Olá ${data.user.name},</p>
<p>Recebemos um pedido para redefinir a sua palavra-passe.</p>
<p>Clique no link abaixo para criar uma nova palavra-passe:</p>
<a href="${data.url}">Redefinir Palavra-passe</a>
<p>Se não pediu esta alteração, pode ignorar este email.</p>`
      })
    },
    async sendEmailVerification(data: any, request?: Request) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Juros <onboarding@resend.dev>',
        to: data.user.email,
        subject: 'Verifique o seu email - Juros',
        html: `<p>Olá ${data.user.name},</p>
<p>Bem-vindo ao Juros! Por favor verifique o seu email para ativar a sua conta.</p>
<a href="${data.url}">Verificar Email</a>`
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
