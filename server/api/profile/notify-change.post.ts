import { Resend } from 'resend'
import { z } from 'zod'
import { auth } from '../../utils/auth'
import { nameChangedTemplate, passwordChangedTemplate } from '../../utils/email-templates'

const notifySchema = z.object({
  changeType: z.enum(['name', 'password']),
  newValue: z.string().optional()
})

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Não autenticado'
    })
  }

  const body = await readBody(event)
  const result = notifySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos'
    })
  }

  const { changeType, newValue } = result.data
  const user = session.user

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.EMAIL_FROM || 'Juros <onboarding@resend.dev>'

  try {
    if (changeType === 'name') {
      await resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: 'O seu perfil foi atualizado - Juros',
        html: nameChangedTemplate(user.name, newValue || user.name)
      })
    } else if (changeType === 'password') {
      await resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: 'A sua palavra-passe foi alterada - Juros',
        html: passwordChangedTemplate(user.name)
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send notification email:', error)
    // Don't throw - notification is not critical
    return { success: false }
  }
})
