import { z } from 'zod'
import { generateAmortizationTable } from '~/composables/useLoanCalculator'
import type { LoanParams, CalculationResult } from '~/composables/useLoanCalculator'

/**
 * API endpoint for mortgage amortization calculation
 * POST /api/calculate
 *
 * Supports variable, fixed, and mixed rate types.
 * For mixed rates, provide fixedPeriodMonths, fixedRate, and variableRate.
 */

const LoanInputSchema = z.object({
  principal: z.number().positive('O montante deve ser positivo'),
  tan: z
    .number()
    .min(0, 'A TAN não pode ser negativa')
    .max(1, 'A TAN deve ser em formato decimal (ex: 0.03 para 3%)'),
  termMonths: z
    .number()
    .int()
    .min(1, 'O prazo mínimo é 1 mês')
    .max(600, 'O prazo máximo é 50 anos'),
  stampDutyRate: z.number().min(0).max(1).default(0.04),
  insuranceRate: z.number().min(0).max(1).default(0),
  // Mixed rate configuration
  rateType: z.enum(['variable', 'fixed', 'mixed']).default('variable'),
  fixedPeriodMonths: z.number().int().min(0).max(600).optional(),
  fixedRate: z.number().min(0).max(1).optional(), // Decimal format
  variableRate: z.number().min(0).max(1).optional() // Decimal format
}).refine((data) => {
  // If mixed rate, require fixedPeriodMonths, fixedRate, and variableRate
  if (data.rateType === 'mixed') {
    return data.fixedPeriodMonths !== undefined
      && data.fixedRate !== undefined
      && data.variableRate !== undefined
      && data.fixedPeriodMonths < data.termMonths
  }
  return true
}, {
  message: 'Taxa mista requer período fixo, taxa fixa e taxa variável válidos'
})

export default defineEventHandler(async (event): Promise<CalculationResult> => {
  const body = await readBody(event)

  const validationResult = LoanInputSchema.safeParse(body)

  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dados de entrada inválidos',
      data: validationResult.error.format()
    })
  }

  const calculation = generateAmortizationTable(validationResult.data as LoanParams)

  return calculation
})
