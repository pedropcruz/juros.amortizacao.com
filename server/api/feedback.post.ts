import { Resend } from 'resend'
import { z } from 'zod'

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'other']),
  message: z.string().min(1).max(5000),
  email: z.string().email().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input
  const result = feedbackSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid feedback data'
    })
  }

  const { type, message, email } = result.data

  // Get user info if authenticated
  const userAgent = getHeader(event, 'user-agent') || 'Unknown'

  // Type labels for email
  const typeLabels = {
    bug: 'Bug / Problema',
    feature: 'Sugestão de Feature',
    other: 'Outro'
  }

  // Send email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY)

  const feedbackEmail = process.env.FEEDBACK_EMAIL || process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'feedback@juros.amortizacao.com'

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Juros <onboarding@resend.dev>',
      to: feedbackEmail,
      subject: `[Juros Feedback] ${typeLabels[type]}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Novo Feedback Recebido</h2>

          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0;"><strong>Tipo:</strong> ${typeLabels[type]}</p>
            ${email ? `<p style="margin: 0 0 8px 0;"><strong>Email do utilizador:</strong> <a href="mailto:${email}">${email}</a></p>` : ''}
            <p style="margin: 0;"><strong>User Agent:</strong> ${userAgent}</p>
          </div>

          <div style="background: #fff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #374151;">Mensagem:</h3>
            <p style="white-space: pre-wrap; color: #4b5563;">${message}</p>
          </div>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Enviado via widget de feedback - Juros
          </p>
        </div>
      `
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send feedback email:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to send feedback'
    })
  }
})
