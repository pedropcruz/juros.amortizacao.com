import { eq, and, inArray } from 'drizzle-orm'
import { useDatabase, schema } from '../../utils/db'
import { auth } from '../../utils/auth'

/**
 * API endpoint for comparing multiple simulations
 * GET /api/simulations/compare?ids=id1,id2,id3
 * Requires authentication and ownership
 * Maximum 3 simulations
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

  const db = useDatabase()

  // Check if user is Pro
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    columns: { isPro: true }
  })

  if (!user?.isPro) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Comparar simulações é uma funcionalidade Pro',
      data: { code: 'PRO_REQUIRED' }
    })
  }

  const query = getQuery(event)
  const idsParam = query.ids as string

  if (!idsParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'IDs das simulações são obrigatórios'
    })
  }

  const ids = idsParam.split(',').filter(Boolean)

  if (ids.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Selecione pelo menos 2 simulações para comparar'
    })
  }

  if (ids.length > 3) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Máximo de 3 simulações para comparação'
    })
  }

  try {
    const db = useDatabase()

    const simulations = await db.query.simulations.findMany({
      where: and(
        inArray(schema.simulations.publicId, ids),
        eq(schema.simulations.userId, session.user.id)
      )
    })

    if (simulations.length !== ids.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Uma ou mais simulações não encontradas'
      })
    }

    // Return simulations in the order requested
    const orderedSimulations = ids.map(id =>
      simulations.find(s => s.publicId === id)
    ).filter(Boolean)

    return orderedSimulations.map(simulation => ({
      id: simulation!.publicId,
      name: simulation!.name,
      loanAmount: simulation!.loanAmount,
      interestRate: simulation!.interestRate,
      euribor: simulation!.euribor,
      spread: simulation!.spread,
      termMonths: simulation!.termMonths,
      stampDutyRate: simulation!.stampDutyRate,
      insuranceRate: simulation!.insuranceRate,
      rateType: simulation!.rateType,
      euriborPeriod: simulation!.euriborPeriod,
      amortizationTable: simulation!.amortizationTable,
      summary: simulation!.summary,
      createdAt: simulation!.createdAt
    }))
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 404 || statusCode === 401 || statusCode === 400) {
      throw error
    }

    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao recuperar simulações'
    })
  }
})
