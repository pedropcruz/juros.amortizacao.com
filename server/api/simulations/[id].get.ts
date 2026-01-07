import { eq, and } from 'drizzle-orm'
import { useDatabase, schema } from '../../utils/db'
import { auth } from '../../utils/auth'

/**
 * API endpoint for retrieving a saved simulation by public ID
 * GET /api/simulations/:id
 * Requires authentication and ownership
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

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da simulação é obrigatório'
    })
  }

  try {
    const db = useDatabase()

    const simulation = await db.query.simulations.findFirst({
      where: and(
        eq(schema.simulations.publicId, id),
        eq(schema.simulations.userId, session.user.id)
      )
    })

    if (!simulation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Simulação não encontrada'
      })
    }

    return {
      id: simulation.publicId,
      name: simulation.name,
      loanAmount: simulation.loanAmount,
      interestRate: simulation.interestRate,
      euribor: simulation.euribor,
      spread: simulation.spread,
      termMonths: simulation.termMonths,
      stampDutyRate: simulation.stampDutyRate,
      insuranceRate: simulation.insuranceRate,
      rateType: simulation.rateType,
      euriborPeriod: simulation.euriborPeriod,
      contractStartDate: simulation.contractStartDate,
      nextRevisionDate: simulation.nextRevisionDate,
      amortizationTable: simulation.amortizationTable,
      summary: simulation.summary,
      createdAt: simulation.createdAt
    }
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 404 || statusCode === 401) {
      throw error
    }

    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao recuperar simulação'
    })
  }
})
