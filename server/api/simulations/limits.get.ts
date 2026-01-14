import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '../../utils/db'
import { auth } from '../../utils/auth'

/**
 * API endpoint to get user's simulation limits
 * GET /api/simulations/limits
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
      totalSimulationsCreated: true
    }
  })

  const FREE_PLAN_LIMIT = 3
  const isPro = userRecord?.isPro || false
  const totalCreated = userRecord?.totalSimulationsCreated || 0

  return {
    isPro,
    totalCreated,
    limit: isPro ? null : FREE_PLAN_LIMIT,
    remaining: isPro ? null : Math.max(0, FREE_PLAN_LIMIT - totalCreated),
    canCreate: isPro || totalCreated < FREE_PLAN_LIMIT
  }
})
