import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '../../utils/db'
import { auth } from '../../utils/auth'

/**
 * API endpoint to get user's billing information
 * GET /api/billing
 * Requires authentication
 */
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autenticação necessária'
    })
  }

  const db = useDatabase()

  const userRecord = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    columns: {
      isPro: true,
      subscriptionId: true,
      subscriptionStatus: true,
      proSince: true,
      orderAmount: true,
      receiptUrl: true
    }
  })

  if (!userRecord?.isPro) {
    return {
      isPro: false,
      order: null
    }
  }

  return {
    isPro: true,
    order: {
      id: userRecord.subscriptionId,
      status: userRecord.subscriptionStatus,
      date: userRecord.proSince,
      amount: userRecord.orderAmount ? userRecord.orderAmount / 100 : null, // Convert cents to euros
      receiptUrl: userRecord.receiptUrl
    }
  }
})
