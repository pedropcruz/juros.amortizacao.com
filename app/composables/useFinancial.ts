/**
 * Financial utilities for mortgage calculations (Client-side)
 */

export type RateType = 'variable' | 'fixed' | 'mixed'
export type EuriborPeriod = '3m' | '6m' | '12m'

const EARLY_REPAYMENT_FEES = {
  variable: 0.005, // 0.5%
  fixed: 0.02, // 2.0%
  mixed: 0.02 // Treated as fixed during the fixed period
}

const STAMP_DUTY_ON_FEE = 0.04 // 4% Imposto do Selo

export const useFinancial = () => {
  /**
   * Calculate the early repayment fee for leaving a mortgage
   */
  function calculateEarlyRepaymentFee(
    amount: number,
    rateType: RateType = 'variable',
    isInFixedPeriod: boolean = false
  ) {
    // Determine the applicable fee rate
    let feeRate: number

    if (rateType === 'mixed') {
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
      feePercentage: Math.round(feePercentage * 1000) / 1000
    }
  }

  function formatRateType(rateType?: RateType | string): string {
    if (!rateType) return 'Desconhecido'
    const labels: Record<string, string> = {
      variable: 'Taxa Variável',
      fixed: 'Taxa Fixa',
      mixed: 'Taxa Mista'
    }
    return labels[rateType] || rateType
  }

  function formatEuriborPeriod(period?: EuriborPeriod | string): string {
    if (!period) return '-'
    const labels: Record<string, string> = {
      '3m': '3 Meses',
      '6m': '6 Meses',
      '12m': '12 Meses'
    }
    return labels[period] || period
  }

  /**
   * Calculate monthly payment (French system)
   */
  function calculateMonthlyPayment(
    principal: number,
    annualRate: number, // Decimal (e.g. 0.035)
    termMonths: number
  ): number {
    if (annualRate === 0) return principal / termMonths
    
    const monthlyRate = annualRate / 12
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) 
      / (Math.pow(1 + monthlyRate, termMonths) - 1)
      
    return payment
  }

  /**
   * Calculate revision impact based on current market rates
   */
  function calculateRevisionImpact(
    simulation: any, // Typed as any to avoid circular deps, but expects Simulation structure
    marketRates: { rate3m: number, rate6m: number, rate12m: number } | null
  ) {
    // 1. Basic checks
    if (!simulation || !marketRates) return null
    if (simulation.rateType === 'fixed') return { impact: 0, label: 'Taxa Fixa', type: 'shield' }
    
    // 2. Identify applicable rate
    const period = simulation.euriborPeriod as EuriborPeriod
    let currentEuribor: number | undefined
    
    if (period === '3m') currentEuribor = marketRates.rate3m
    else if (period === '6m') currentEuribor = marketRates.rate6m
    else if (period === '12m') currentEuribor = marketRates.rate12m
    
    if (currentEuribor === undefined) return null

    // 3. Determine current state (months elapsed)
    const startDate = new Date(simulation.createdAt)
    const today = new Date()
    // Difference in months
    const monthsElapsed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth())
    
    // Clamp months (if simulation is new, 0 months. if older than term, term months)
    const currentMonthIndex = Math.max(0, Math.min(monthsElapsed, simulation.termMonths - 1))
    
    // Get remaining balance from amortization table
    // If table doesn't have enough rows (shouldn't happen), fallback to 0
    const currentRow = simulation.amortizationTable?.[currentMonthIndex]
    if (!currentRow) return null
    
    const remainingPrincipal = currentRow.remainingBalance
    const remainingMonths = simulation.termMonths - currentMonthIndex
    
    if (remainingPrincipal <= 0 || remainingMonths <= 0) return { impact: 0, label: 'Pago', type: 'neutral' }

    // 4. Calculate New Payment
    // Spread is stored as percentage (e.g. 1.0), Euribor from market is percentage (e.g. 3.5)
    // Convert to decimal for calculation: (3.5 + 1.0) / 100 = 0.045
    const spread = simulation.spread || 0
    const newTan = (currentEuribor + spread) / 100
    
    const newPaymentRaw = calculateMonthlyPayment(remainingPrincipal, newTan, remainingMonths)
    
    // Add stamp duty (if applicable, usually 4% on interest) - approximating for simple payment comparison
    // To match the simulation exactness, we should add IS. 
    // Simulation `summary.monthlyPayment` likely includes IS.
    // Let's assume standard IS on Interest.
    // New Interest part = remainingPrincipal * newTan / 12
    // IS = Interest * 0.04
    const newMonthlyInterest = remainingPrincipal * (newTan / 12)
    const newStampDuty = newMonthlyInterest * (simulation.stampDutyRate || 0.04)
    // Insurance? Assuming insurance rate stays same relative to capital, but might change. 
    // Let's keep insurance from current row or approximate?
    // Actually, `summary.monthlyPayment` is the total.
    // The currentRow has `insurance` value. Let's use that as baseline or recompute if rate provided.
    const currentInsurance = currentRow.insurance
    
    const newTotalPayment = newPaymentRaw + newStampDuty + currentInsurance
    
    // 5. Compare with CURRENT payment (from the row, which reflects the scheduled payment for this month)
    // Using `currentRow.totalPayment` which is what user expects to pay this month according to old plan.
    const currentScheduledPayment = currentRow.totalPayment
    
    const difference = newTotalPayment - currentScheduledPayment
    
    return {
      impact: difference, // +45 or -12
      newPayment: newTotalPayment,
      oldPayment: currentScheduledPayment,
      label: difference > 0 ? 'Risco de Aumento' : 'Oportunidade',
      type: difference > 0 ? 'danger' : 'success'
    }
  }

  return {
    calculateEarlyRepaymentFee,
    formatRateType,
    formatEuriborPeriod,
    calculateRevisionImpact
  }
}
