/**
 * Portuguese Mortgage Calculator - Sistema Francês (French Amortization System)
 *
 * The French system is characterized by constant monthly payments (PMT) while
 * the interest rate remains unchanged. Over time, the interest portion decreases
 * and the principal portion increases.
 *
 * Key formulas:
 * - PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
 * - Monthly rate i = TAN / 12 (linear division, NOT compound)
 * - Interest Jk = SD(k-1) × i
 * - Principal Ak = PMT - Jk
 * - Balance SDk = SD(k-1) - Ak
 * - Stamp Duty ISk = Jk × 4%
 */

export interface AmortizationRow {
  paymentNumber: number
  installment: number // PMT (base payment without extras)
  interest: number // Jk
  principal: number // Ak
  stampDuty: number // ISk (Imposto do Selo)
  insurance: number // Seguro vida/multiriscos
  totalPayment: number // PMT + IS + Insurance
  remainingBalance: number // SDk
}

export interface LoanParams {
  principal: number // PV - Loan amount
  tan: number // Taxa Anual Nominal (decimal, e.g., 0.03 for 3%)
  termMonths: number // n - Total months
  stampDutyRate?: number // Default 4% in Portugal
  insuranceRate?: number // Rate per mille applied to remaining balance
  // Mixed rate configuration
  rateType?: 'variable' | 'fixed' | 'mixed'
  fixedPeriodMonths?: number // Duration of fixed rate period (for mixed rates)
  fixedRate?: number // Fixed rate during initial period (decimal)
  variableRate?: number // Variable rate after fixed period (Euribor + Spread, decimal)
}

export interface CalculationResult {
  table: AmortizationRow[]
  summary: {
    monthlyPayment: number
    totalPayment: number
    totalInterest: number
    totalStampDuty: number
    totalInsurance: number
    interestToPrincipalRatio: number
    // Mixed rate specific fields (optional)
    monthlyPaymentAfterFixedPeriod?: number
    fixedPeriodMonths?: number
    paymentIncrease?: number
    paymentIncreasePercent?: number
  }
}

export interface EarlyRepaymentParams {
  currentBalance: number
  repaymentAmount: number
  rateType: 'variable' | 'fixed'
  feeExemption?: boolean
  strategy?: 'reduce_installment' | 'reduce_term'
  remainingMonths?: number
  tan?: number
  currentInstallment?: number
}

export interface EarlyRepaymentResult {
  fee: number
  newBalance: number
  newInstallment?: number
  newTermMonths?: number
  interestSaved?: number
}

/**
 * Convert TAN (Taxa Anual Nominal) to monthly rate
 * IMPORTANT: Portuguese banks use linear division (TAN/12), NOT compound equivalence
 */
export function calculateMonthlyRate(tan: number): number {
  return tan / 12
}

/**
 * Calculate monthly installment (PMT) using the French amortization formula
 * PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
 */
export function calculateInstallment(
  principal: number,
  tan: number,
  termMonths: number
): number {
  // Handle zero interest rate
  if (tan === 0) {
    return principal / termMonths
  }

  const i = calculateMonthlyRate(tan)
  const n = termMonths

  // Calculate (1+i)^n
  const compoundFactor = Math.pow(1 + i, n)

  // PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
  const pmt = principal * (i * compoundFactor) / (compoundFactor - 1)

  return pmt
}

/**
 * Generate complete amortization table for the loan
 * Supports variable, fixed, and mixed rate types
 *
 * For mixed rates:
 * - Fixed rate applies for the first fixedPeriodMonths
 * - After that, variable rate kicks in and payment is recalculated
 *   based on remaining balance and remaining term
 */
export function generateAmortizationTable(params: LoanParams): CalculationResult {
  const {
    principal: loanPrincipal,
    tan,
    termMonths,
    stampDutyRate = 0.04, // Default 4% in Portugal
    insuranceRate = 0,
    rateType = 'variable',
    fixedPeriodMonths = 0,
    fixedRate,
    variableRate
  } = params

  const table: AmortizationRow[] = []

  // Determine if we're dealing with a mixed rate scenario
  const isMixedRate = rateType === 'mixed'
    && fixedPeriodMonths > 0
    && fixedPeriodMonths < termMonths
    && fixedRate !== undefined
    && variableRate !== undefined

  // Initial rate setup
  let currentTan = isMixedRate ? fixedRate! : tan
  let monthlyRate = calculateMonthlyRate(currentTan)
  let pmt = calculateInstallment(loanPrincipal, currentTan, termMonths)

  // Track the initial payment for the summary (before rate change)
  const initialMonthlyPayment = pmt

  // For mixed rates, we'll also track the payment after rate change
  let paymentAfterRateChange: number | null = null

  let remainingBalance = loanPrincipal
  let totalInterest = 0
  let totalStampDuty = 0
  let totalInsurance = 0

  for (let month = 1; month <= termMonths; month++) {
    // Check if we need to switch rates (mixed rate scenario)
    if (isMixedRate && month === fixedPeriodMonths + 1) {
      // Switch to variable rate
      currentTan = variableRate!
      monthlyRate = calculateMonthlyRate(currentTan)

      // Recalculate payment based on remaining balance and remaining term
      const remainingTerm = termMonths - fixedPeriodMonths
      pmt = calculateInstallment(remainingBalance, currentTan, remainingTerm)
      paymentAfterRateChange = pmt
    }

    // Calculate interest for this period: Jk = SD(k-1) × i
    const interest = remainingBalance * monthlyRate

    // Calculate principal portion: Ak = PMT - Jk
    const principalPayment = pmt - interest

    // Update remaining balance: SDk = SD(k-1) - Ak
    remainingBalance = remainingBalance - principalPayment

    // Handle floating point precision for final payment
    if (month === termMonths) {
      remainingBalance = Math.max(0, remainingBalance)
      if (remainingBalance < 0.01) {
        remainingBalance = 0
      }
    }

    // Calculate Imposto do Selo (Stamp Duty): ISk = Jk × 4%
    const stampDuty = interest * stampDutyRate

    // Calculate insurance based on remaining balance (applied to previous balance)
    const insurance = (remainingBalance + principalPayment) * insuranceRate

    // Total payment includes all costs
    const totalPayment = pmt + stampDuty + insurance

    totalInterest += interest
    totalStampDuty += stampDuty
    totalInsurance += insurance

    table.push({
      paymentNumber: month,
      installment: pmt,
      interest,
      principal: principalPayment,
      stampDuty,
      insurance,
      totalPayment,
      remainingBalance
    })
  }

  const totalPaymentSum = table.reduce((sum, row) => sum + row.totalPayment, 0)

  const roundedTable = table.map(row => ({
    ...row,
    installment: Math.round(row.installment * 100) / 100,
    interest: Math.round(row.interest * 100) / 100,
    principal: Math.round(row.principal * 100) / 100,
    stampDuty: Math.round(row.stampDuty * 100) / 100,
    insurance: Math.round(row.insurance * 100) / 100,
    totalPayment: Math.round(row.totalPayment * 100) / 100,
    remainingBalance: Math.round(row.remainingBalance * 100) / 100
  }))

  // Build summary with mixed rate info if applicable
  const summary: CalculationResult['summary'] = {
    monthlyPayment: Math.round(initialMonthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPaymentSum * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalStampDuty: Math.round(totalStampDuty * 100) / 100,
    totalInsurance: Math.round(totalInsurance * 100) / 100,
    interestToPrincipalRatio:
      loanPrincipal > 0 ? Math.round((totalInterest / loanPrincipal) * 10000) / 100 : 0
  }

  // Add mixed rate specific info to summary
  if (isMixedRate && paymentAfterRateChange !== null) {
    summary.monthlyPaymentAfterFixedPeriod = Math.round(paymentAfterRateChange * 100) / 100
    summary.fixedPeriodMonths = fixedPeriodMonths
    summary.paymentIncrease = Math.round((paymentAfterRateChange - initialMonthlyPayment) * 100) / 100
    summary.paymentIncreasePercent = Math.round(((paymentAfterRateChange - initialMonthlyPayment) / initialMonthlyPayment) * 10000) / 100
  }

  return {
    table: roundedTable,
    summary
  }
}

/**
 * Calculate early repayment (amortizacao antecipada) with Portuguese rules
 *
 * Portuguese regulations:
 * - Variable rate: max 0.5% fee on repaid amount
 * - Fixed rate: max 2.0% fee on repaid amount
 * - Government exemptions may apply (e.g., 2023/2024 measures)
 */
export function calculateEarlyRepayment(params: EarlyRepaymentParams): EarlyRepaymentResult {
  const {
    currentBalance,
    repaymentAmount,
    rateType,
    feeExemption = false,
    strategy,
    remainingMonths,
    tan,
    currentInstallment
  } = params

  // Calculate fee based on rate type
  let feeRate = rateType === 'variable' ? 0.005 : 0.02
  if (feeExemption) {
    feeRate = 0
  }

  const fee = repaymentAmount * feeRate
  const newBalance = currentBalance - repaymentAmount

  const result: EarlyRepaymentResult = {
    fee,
    newBalance
  }

  // Calculate impact based on strategy
  if (strategy === 'reduce_installment' && remainingMonths && tan !== undefined) {
    // Keep same term, reduce monthly payment
    result.newInstallment = calculateInstallment(newBalance, tan, remainingMonths)
    result.newTermMonths = remainingMonths
  } else if (strategy === 'reduce_term' && currentInstallment && tan !== undefined) {
    // Keep same payment, reduce term
    result.newInstallment = currentInstallment

    // Calculate new term by iterating until balance reaches 0
    let balance = newBalance
    const monthlyRate = calculateMonthlyRate(tan)
    let months = 0

    while (balance > 0.01 && months < 600) { // Max 50 years safety
      const interest = balance * monthlyRate
      const principal = currentInstallment - interest

      if (principal <= 0) {
        // Payment doesn't cover interest - loan is underwater
        break
      }

      balance -= principal
      months++
    }

    result.newTermMonths = months
  }

  return result
}

/**
 * Vue composable for loan calculator
 */
export function useLoanCalculator() {
  return {
    calculateMonthlyRate,
    calculateInstallment,
    generateAmortizationTable,
    calculateEarlyRepayment
  }
}

export default useLoanCalculator
