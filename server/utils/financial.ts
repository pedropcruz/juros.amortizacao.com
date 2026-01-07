/**
 * Financial utilities for mortgage calculations
 * These are the core business logic functions for the SaaS
 */

export type RateType = 'variable' | 'fixed' | 'mixed'
export type EuriborPeriod = '3m' | '6m' | '12m'

/**
 * Portuguese early repayment fee rates (as per Decreto-Lei 74-A/2017)
 * - Variable rate: 0.5% of the amount repaid
 * - Fixed rate: 2.0% of the amount repaid
 * - Stamp duty (Imposto do Selo): 4% on the fee
 */
const EARLY_REPAYMENT_FEES = {
  variable: 0.005, // 0.5%
  fixed: 0.02, // 2.0%
  mixed: 0.02 // Treated as fixed during the fixed period
}

const STAMP_DUTY_ON_FEE = 0.04 // 4% Imposto do Selo

/**
 * Calculate the early repayment fee for leaving a mortgage
 * This is crucial for calculating the true cost of switching banks
 *
 * @param amount - The amount being repaid early (capital)
 * @param rateType - The type of interest rate (variable, fixed, mixed)
 * @param isInFixedPeriod - For mixed rates, whether still in the fixed period
 * @returns Object with fee breakdown
 */
export function calculateEarlyRepaymentFee(
  amount: number,
  rateType: RateType,
  isInFixedPeriod: boolean = false
): {
  baseFee: number
  stampDuty: number
  totalFee: number
  feePercentage: number
} {
  // Determine the applicable fee rate
  let feeRate: number

  if (rateType === 'mixed') {
    // Mixed rate: use fixed rate if still in fixed period, otherwise variable
    feeRate = isInFixedPeriod ? EARLY_REPAYMENT_FEES.fixed : EARLY_REPAYMENT_FEES.variable
  } else {
    feeRate = EARLY_REPAYMENT_FEES[rateType]
  }

  // Calculate the base fee
  const baseFee = amount * feeRate

  // Calculate stamp duty on the fee
  const stampDuty = baseFee * STAMP_DUTY_ON_FEE

  // Total fee
  const totalFee = baseFee + stampDuty

  // Effective fee percentage (for display)
  const feePercentage = feeRate * (1 + STAMP_DUTY_ON_FEE) * 100

  return {
    baseFee: Math.round(baseFee * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    feePercentage: Math.round(feePercentage * 1000) / 1000 // e.g., 0.52% or 2.08%
  }
}

/**
 * Calculate the monthly payment using the French amortization system
 * This is the standard system used by Portuguese banks
 *
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate (TAN) as decimal (e.g., 0.035 for 3.5%)
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return principal / termMonths
  }

  const monthlyRate = annualRate / 12
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))
    / (Math.pow(1 + monthlyRate, termMonths) - 1)

  return Math.round(payment * 100) / 100
}

/**
 * Estimate the new monthly payment after Euribor revision
 *
 * @param currentBalance - Current outstanding balance
 * @param newEuribor - New Euribor rate (as percentage, e.g., 3.5)
 * @param spread - Bank spread (as percentage, e.g., 1.0)
 * @param remainingMonths - Remaining loan term in months
 * @param stampDutyRate - Stamp duty rate on interest (default 4%)
 * @returns New monthly payment estimate
 */
export function estimateNewPayment(
  currentBalance: number,
  newEuribor: number,
  spread: number,
  remainingMonths: number,
  stampDutyRate: number = 0.04
): {
  monthlyPayment: number
  tan: number
} {
  // Calculate TAN (Taxa Anual Nominal)
  const tan = (newEuribor + spread) / 100

  // Calculate base monthly payment
  const basePayment = calculateMonthlyPayment(currentBalance, tan, remainingMonths)

  // Add stamp duty on interest portion (approximation for first month)
  const monthlyInterest = currentBalance * (tan / 12)
  const stampDuty = monthlyInterest * stampDutyRate

  return {
    monthlyPayment: Math.round((basePayment + stampDuty) * 100) / 100,
    tan: Math.round(tan * 10000) / 10000
  }
}

/**
 * Calculate the break-even point for switching banks
 * How many months until the switching costs are recovered by lower payments
 *
 * @param switchingCosts - Total cost of switching (early repayment fee + new bank fees)
 * @param currentPayment - Current monthly payment
 * @param newPayment - New monthly payment after switch
 * @returns Number of months to break even, or null if switch doesn't make sense
 */
export function calculateBreakEvenMonths(
  switchingCosts: number,
  currentPayment: number,
  newPayment: number
): number | null {
  const monthlySavings = currentPayment - newPayment

  if (monthlySavings <= 0) {
    // No savings, switch doesn't make financial sense
    return null
  }

  const breakEvenMonths = Math.ceil(switchingCosts / monthlySavings)
  return breakEvenMonths
}

/**
 * Get the Euribor period in human-readable format
 */
export function formatEuriborPeriod(period: EuriborPeriod): string {
  const labels: Record<EuriborPeriod, string> = {
    '3m': '3 Meses',
    '6m': '6 Meses',
    '12m': '12 Meses'
  }
  return labels[period]
}

/**
 * Get the rate type in human-readable format
 */
export function formatRateType(rateType: RateType): string {
  const labels: Record<RateType, string> = {
    variable: 'Taxa Variável',
    fixed: 'Taxa Fixa',
    mixed: 'Taxa Mista'
  }
  return labels[rateType]
}
