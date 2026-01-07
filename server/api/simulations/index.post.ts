import { z } from 'zod'
import { eq, count } from 'drizzle-orm'
import { useDatabase, schema } from '../../utils/db'
import { auth } from '../../utils/auth'

/**
 * API endpoint for saving a mortgage simulation
 * POST /api/simulations
 * Requires authentication
 */

const SaveSimulationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  loanAmount: z.number().positive(),
  interestRate: z.number().min(0).max(1), // TAN
  euribor: z.number().optional(),
  spread: z.number().optional(),
  termMonths: z.number().int().min(1).max(600),
  stampDutyRate: z.number().min(0).max(1).default(0.04),
  insuranceRate: z.number().min(0).max(1).default(0),
  // New fields for rate intelligence
  rateType: z.enum(['variable', 'fixed', 'mixed']).default('variable'),
  euriborPeriod: z.enum(['3m', '6m', '12m']).optional(),
  contractStartDate: z.string().optional(), // ISO date string
  nextRevisionDate: z.string().optional(), // ISO date string
  amortizationTable: z.array(z.object({
    paymentNumber: z.number(),
    installment: z.number(),
    interest: z.number(),
    principal: z.number(),
    stampDuty: z.number(),
    insurance: z.number(),
    totalPayment: z.number(),
    remainingBalance: z.number()
  })),
  summary: z.object({
    monthlyPayment: z.number(),
    totalPayment: z.number(),
    totalInterest: z.number(),
    totalStampDuty: z.number(),
    totalInsurance: z.number(),
    effectiveRate: z.number()
  })
}).refine(
  // If rate type is variable, euriborPeriod should be provided
  (data) => {
    if (data.rateType === 'variable' || data.rateType === 'mixed') {
      return data.euriborPeriod !== undefined
    }
    return true
  },
  {
    message: 'Período Euribor é obrigatório para taxa variável ou mista',
    path: ['euriborPeriod']
  }
)

export default defineEventHandler(async (event) => {
  // Verify authentication
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autenticação necessária para guardar simulações'
    })
  }

  const db = useDatabase()

  // Check Free Plan Limits
  const user = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
      columns: {
          isPro: true
      }
  })

  if (!user?.isPro) {
      // Count existing simulations
      const [result] = await db
          .select({ count: count() })
          .from(schema.simulations)
          .where(eq(schema.simulations.userId, session.user.id))
      
      const simulationCount = result?.count || 0
      
      if (simulationCount >= 3) {
          throw createError({
              statusCode: 403,
              statusMessage: 'Limite de simulações atingido (Máximo 3). Atualize para Pro para guardar ilimitado.',
              data: {
                  code: 'LIMIT_REACHED',
                  limit: 3
              }
          })
      }
  }

  const body = await readBody(event)

  // Validate input
  const result = SaveSimulationSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dados de entrada inválidos',
      data: result.error.format()
    })
  }

  // Generate unique public ID
  const publicId = crypto.randomUUID()

  // Generate default name if not provided
  const defaultName = `Simulação ${new Date().toLocaleDateString('pt-PT')}`

  try {
    const [simulation] = await db.insert(schema.simulations).values({
      publicId,
      userId: session.user.id,
      name: result.data.name || defaultName,
      loanAmount: result.data.loanAmount,
      interestRate: result.data.interestRate,
      euribor: result.data.euribor,
      spread: result.data.spread,
      termMonths: result.data.termMonths,
      stampDutyRate: result.data.stampDutyRate,
      insuranceRate: result.data.insuranceRate,
      rateType: result.data.rateType,
      euriborPeriod: result.data.euriborPeriod,
      contractStartDate: result.data.contractStartDate,
      nextRevisionDate: result.data.nextRevisionDate,
      amortizationTable: result.data.amortizationTable,
      summary: result.data.summary
    }).returning()

    if (!simulation) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar simulação'
      })
    }

    return {
      id: simulation.publicId,
      name: simulation.name,
      message: 'Simulação guardada com sucesso'
    }
  } catch (error) {
    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao guardar simulação'
    })
  }
})
