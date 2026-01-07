import { eq, desc } from 'drizzle-orm'
import { useDatabase, schema } from '../../utils/db'
import { auth } from '../../utils/auth'

/**
 * API endpoint for listing user's simulations
 * GET /api/simulations
 * Requires authentication
 */

export default defineEventHandler(async (event) => {
  // Verify authentication
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autenticação necessária'
    })
  }

  try {
    const db = useDatabase()

    const simulations = await db.query.simulations.findMany({
      where: eq(schema.simulations.userId, session.user.id),
      orderBy: [desc(schema.simulations.createdAt)],
      columns: {
        id: true,
        publicId: true,
        name: true,
        loanAmount: true,
        interestRate: true,
        euribor: true,
        spread: true,
        termMonths: true,
        rateType: true,
        euriborPeriod: true,
        nextRevisionDate: true,
        summary: true,
        createdAt: true
      }
    })

    return simulations.map(sim => ({
      id: sim.publicId,
      name: sim.name,
      loanAmount: sim.loanAmount,
      interestRate: sim.interestRate,
      euribor: sim.euribor,
      spread: sim.spread,
      termMonths: sim.termMonths,
      rateType: sim.rateType,
      euriborPeriod: sim.euriborPeriod,
      nextRevisionDate: sim.nextRevisionDate,
      summary: sim.summary,
      createdAt: sim.createdAt
    }))
  } catch (error) {
    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao carregar simulações'
    })
  }
})
