import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
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

  // Check Free Plan Limits (lifetime limit)
  const userRecord = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    columns: {
      isPro: true,
      totalSimulationsCreated: true
    }
  })

  const FREE_PLAN_LIMIT = 3

  if (!userRecord?.isPro) {
    const totalCreated = userRecord?.totalSimulationsCreated || 0

    if (totalCreated >= FREE_PLAN_LIMIT) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Limite de simulações atingido. Ja criou 3 simulações. Atualize para Pro para criar ilimitadas.',
        data: {
          code: 'LIFETIME_LIMIT_REACHED',
          limit: FREE_PLAN_LIMIT,
          created: totalCreated
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

    // Increment lifetime simulation counter for the user
    await db.update(schema.user)
      .set({ totalSimulationsCreated: sql`${schema.user.totalSimulationsCreated} + 1` })
      .where(eq(schema.user.id, session.user.id))

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
