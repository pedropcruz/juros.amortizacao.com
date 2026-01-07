import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    // If secret is not set, we can't verify. For safety, fail.
    // However, in dev/setup, maybe we just log warning? No, safety first.
    throw createError({ statusCode: 500, message: 'Webhook secret not configured' })
  }

  // 1. Verify Signature
  const rawBody = await readRawBody(event)
  if (!rawBody) {
      throw createError({ statusCode: 400, message: 'No body' })
  }
  
  const hmac = crypto.createHmac('sha256', secret)
  const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8')
  const signatureHeader = getHeader(event, 'x-signature')
  
  if (!signatureHeader) {
      throw createError({ statusCode: 401, message: 'No signature' })
  }

  const signature = Buffer.from(signatureHeader, 'utf8')

  if (digest.length !== signature.length || !crypto.timingSafeEqual(digest, signature)) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  const payload = JSON.parse(rawBody)
  const { meta, data } = payload
  const eventName = meta.event_name

  console.log(`Received Lemon Squeezy event: ${eventName}`)

  // 2. Handle Events
  // We care about 'order_created' for LTD (Lifetime Deal)
  // We also might care about 'subscription_created' if we switch to subs later
  if (eventName === 'order_created') {
      const attributes = data.attributes
      const customerEmail = attributes.user_email
      const status = attributes.status // 'paid'
      
      if (status === 'paid') {
          const db = useDatabase()
          
          // Check if custom_data.user_id exists (sent from frontend)
          let userId = meta.custom_data?.user_id
          
          if (!userId) {
              // Fallback to email matching
              const user = await db.query.user.findFirst({
                  where: eq(schema.user.email, customerEmail)
              })
              userId = user?.id
          }

          if (userId) {
              await db.update(schema.user)
                .set({
                    isPro: true,
                    subscriptionId: data.id, // Order ID
                    customerId: attributes.customer_id.toString(),
                    subscriptionStatus: 'lifetime',
                    updatedAt: new Date()
                })
                .where(eq(schema.user.id, userId))
                
               console.log(`Upgraded user ${userId} to Pro`)
          } else {
              console.warn(`User not found for email: ${customerEmail}`)
          }
      }
  }

  return { received: true }
})
