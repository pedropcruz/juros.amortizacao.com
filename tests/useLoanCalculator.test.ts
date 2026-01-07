import { describe, it, expect } from 'vitest'
import {
  calculateMonthlyRate,
  calculateInstallment,
  generateAmortizationTable,
  calculateEarlyRepayment,
  type AmortizationRow
} from '~/composables/useLoanCalculator'

describe('useLoanCalculator', () => {
  describe('calculateMonthlyRate', () => {
    it('should convert TAN to monthly rate using linear division', () => {
      const tan = 0.03
      const monthlyRate = calculateMonthlyRate(tan)
      expect(monthlyRate).toBeCloseTo(0.0025, 6)
    })

    it('should handle TAN with spread', () => {
      const euribor = 0.03
      const spread = 0.01
      const tan = euribor + spread
      const monthlyRate = calculateMonthlyRate(tan)
      expect(monthlyRate).toBeCloseTo(0.04 / 12, 6)
    })
  })

  describe('calculateInstallment (PMT)', () => {
    it('should calculate correct monthly installment for standard loan', () => {
      const principal = 100000
      const tan = 0.03
      const termMonths = 360

      const pmt = calculateInstallment(principal, tan, termMonths)

      expect(pmt).toBeCloseTo(421.6, 0)
    })

    it('should calculate correct PMT for short-term loan', () => {
      const principal = 50000
      const tan = 0.04
      const termMonths = 120

      const pmt = calculateInstallment(principal, tan, termMonths)

      expect(pmt).toBeCloseTo(506.23, 0)
    })

    it('should return principal/termMonths when interest rate is 0', () => {
      const principal = 120000
      const tan = 0
      const termMonths = 120

      const pmt = calculateInstallment(principal, tan, termMonths)
      expect(pmt).toBe(1000)
    })
  })

  describe('generateAmortizationTable', () => {
    it('should generate correct number of rows', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360
      })

      expect(table.length).toBe(360)
    })

    it('should have first payment with high interest and low principal', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360
      })

      const firstPayment = table[0]!

      expect(firstPayment.interest).toBeCloseTo(250, 1)
      expect(firstPayment.principal).toBeCloseTo(171.6, 0)
      expect(firstPayment.paymentNumber).toBe(1)
    })

    it('should have final balance close to zero', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360
      })

      const lastPayment = table[table.length - 1]!

      expect(lastPayment.remainingBalance).toBeCloseTo(0, 2)
    })

    it('should show decreasing interest and increasing principal over time', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360
      })

      expect(table[0]!.interest).toBeGreaterThan(table[180]!.interest)
      expect(table[180]!.interest).toBeGreaterThan(table[359]!.interest)

      expect(table[0]!.principal).toBeLessThan(table[180]!.principal)
      expect(table[180]!.principal).toBeLessThan(table[359]!.principal)
    })

    it('should calculate Imposto do Selo at 4% of interest', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360,
        stampDutyRate: 0.04
      })

      const firstPayment = table[0]!

      expect(firstPayment.stampDuty).toBeCloseTo(
        firstPayment.interest * 0.04,
        2
      )
    })

    it('should calculate insurance premium based on remaining balance', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360,
        insuranceRate: 0.0003
      })

      const firstPayment = table[0]!
      expect(firstPayment.insurance).toBeCloseTo(30, 1)

      const lastPayment = table[table.length - 1]!
      expect(lastPayment.insurance).toBeLessThan(firstPayment.insurance)
    })

    it('should calculate total payment including all costs', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360,
        stampDutyRate: 0.04,
        insuranceRate: 0.0003
      })

      const firstPayment = table[0]!

      const expectedTotal
        = firstPayment.installment
          + firstPayment.stampDuty
          + firstPayment.insurance
      expect(firstPayment.totalPayment).toBeCloseTo(expectedTotal, 2)
    })
  })

  describe('calculateEarlyRepayment', () => {
    it('should calculate early repayment fee for variable rate (0.5%)', () => {
      const result = calculateEarlyRepayment({
        currentBalance: 80000,
        repaymentAmount: 10000,
        rateType: 'variable'
      })

      expect(result.fee).toBe(50)
      expect(result.newBalance).toBe(70000)
    })

    it('should calculate early repayment fee for fixed rate (2%)', () => {
      const result = calculateEarlyRepayment({
        currentBalance: 80000,
        repaymentAmount: 10000,
        rateType: 'fixed'
      })

      expect(result.fee).toBe(200)
      expect(result.newBalance).toBe(70000)
    })

    it('should allow fee exemption', () => {
      const result = calculateEarlyRepayment({
        currentBalance: 80000,
        repaymentAmount: 10000,
        rateType: 'variable',
        feeExemption: true
      })

      expect(result.fee).toBe(0)
      expect(result.newBalance).toBe(70000)
    })

    describe('reduce installment option', () => {
      it('should recalculate new PMT when reducing installment', () => {
        const { table: originalTable } = generateAmortizationTable({
          principal: 100000,
          tan: 0.03,
          termMonths: 360
        })

        const currentBalance = originalTable[59]!.remainingBalance
        const remainingMonths = 300

        const result = calculateEarlyRepayment({
          currentBalance,
          repaymentAmount: 20000,
          rateType: 'variable',
          strategy: 'reduce_installment',
          remainingMonths,
          tan: 0.03
        })

        expect(result.newInstallment).toBeDefined()
        expect(result.newInstallment!).toBeLessThan(421.6)
        expect(result.newTermMonths).toBe(remainingMonths)
      })
    })

    describe('reduce term option', () => {
      it('should calculate new term when reducing term', () => {
        const result = calculateEarlyRepayment({
          currentBalance: 80000,
          repaymentAmount: 20000,
          rateType: 'variable',
          strategy: 'reduce_term',
          remainingMonths: 300,
          tan: 0.03,
          currentInstallment: 421.6
        })

        expect(result.newTermMonths).toBeDefined()
        expect(result.newTermMonths!).toBeLessThan(300)
        expect(result.newInstallment).toBeCloseTo(421.6, 0)
      })
    })
  })

  describe('summary calculations', () => {
    it('should calculate total interest paid over loan lifetime', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360
      })

      const totalInterest = table.reduce(
        (sum: number, row: AmortizationRow) => sum + row.interest,
        0
      )

      expect(totalInterest).toBeCloseTo(51777, -2)
    })

    it('should show that early payments save more interest', () => {
      const { table } = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360
      })

      const first5YearsInterest = table
        .slice(0, 60)
        .reduce((sum: number, row: AmortizationRow) => sum + row.interest, 0)
      const last5YearsInterest = table
        .slice(300, 360)
        .reduce((sum: number, row: AmortizationRow) => sum + row.interest, 0)

      expect(first5YearsInterest).toBeGreaterThan(last5YearsInterest * 5)
    })
  })

  describe('mixed rate calculations', () => {
    it('should generate correct number of rows for mixed rate', () => {
      const { table } = generateAmortizationTable({
        principal: 200000,
        tan: 0.035, // This will be overridden for mixed rate
        termMonths: 360,
        rateType: 'mixed',
        fixedPeriodMonths: 60, // 5 years fixed
        fixedRate: 0.025, // 2.5% fixed rate
        variableRate: 0.04 // 4% variable rate after
      })

      expect(table.length).toBe(360)
    })

    it('should apply fixed rate during fixed period', () => {
      const { table } = generateAmortizationTable({
        principal: 200000,
        tan: 0.035,
        termMonths: 360,
        rateType: 'mixed',
        fixedPeriodMonths: 60,
        fixedRate: 0.025,
        variableRate: 0.04
      })

      // First month should use fixed rate (2.5% / 12)
      const firstPayment = table[0]!
      const expectedMonthlyRate = 0.025 / 12
      const expectedFirstInterest = 200000 * expectedMonthlyRate

      expect(firstPayment.interest).toBeCloseTo(expectedFirstInterest, 0)
    })

    it('should change payment after fixed period ends', () => {
      const { table } = generateAmortizationTable({
        principal: 200000,
        tan: 0.035,
        termMonths: 360,
        rateType: 'mixed',
        fixedPeriodMonths: 60,
        fixedRate: 0.025,
        variableRate: 0.04
      })

      const lastFixedPeriodPayment = table[59]! // Month 60
      const firstVariablePeriodPayment = table[60]! // Month 61

      // Payment should increase when switching to higher variable rate
      expect(firstVariablePeriodPayment.installment).toBeGreaterThan(lastFixedPeriodPayment.installment)
    })

    it('should recalculate PMT based on remaining balance after fixed period', () => {
      const { table } = generateAmortizationTable({
        principal: 200000,
        tan: 0.035,
        termMonths: 360,
        rateType: 'mixed',
        fixedPeriodMonths: 60,
        fixedRate: 0.025,
        variableRate: 0.04
      })

      // Get the balance at the end of fixed period
      const balanceAtEndOfFixed = table[59]!.remainingBalance
      const remainingTerm = 300 // 360 - 60

      // Manually calculate what the new PMT should be
      const monthlyRate = 0.04 / 12
      const expectedPMT = balanceAtEndOfFixed * (monthlyRate * Math.pow(1 + monthlyRate, remainingTerm))
        / (Math.pow(1 + monthlyRate, remainingTerm) - 1)

      const firstVariablePayment = table[60]!.installment

      expect(firstVariablePayment).toBeCloseTo(expectedPMT, 0)
    })

    it('should include mixed rate info in summary', () => {
      const { summary } = generateAmortizationTable({
        principal: 200000,
        tan: 0.035,
        termMonths: 360,
        rateType: 'mixed',
        fixedPeriodMonths: 60,
        fixedRate: 0.025,
        variableRate: 0.04
      })

      expect(summary.monthlyPaymentAfterFixedPeriod).toBeDefined()
      expect(summary.fixedPeriodMonths).toBe(60)
      expect(summary.paymentIncrease).toBeDefined()
      expect(summary.paymentIncreasePercent).toBeDefined()

      // Payment should increase (going from 2.5% to 4%)
      expect(summary.paymentIncrease!).toBeGreaterThan(0)
    })

    it('should have final balance close to zero for mixed rate', () => {
      const { table } = generateAmortizationTable({
        principal: 200000,
        tan: 0.035,
        termMonths: 360,
        rateType: 'mixed',
        fixedPeriodMonths: 60,
        fixedRate: 0.025,
        variableRate: 0.04
      })

      const lastPayment = table[table.length - 1]!
      expect(lastPayment.remainingBalance).toBeCloseTo(0, 1)
    })

    it('should calculate higher total interest for mixed rate with rate increase', () => {
      const fixedResult = generateAmortizationTable({
        principal: 200000,
        tan: 0.025,
        termMonths: 360
      })

      const mixedResult = generateAmortizationTable({
        principal: 200000,
        tan: 0.025,
        termMonths: 360,
        rateType: 'mixed',
        fixedPeriodMonths: 60,
        fixedRate: 0.025,
        variableRate: 0.04
      })

      // Mixed rate with increase to 4% should pay more interest than fixed 2.5%
      expect(mixedResult.summary.totalInterest).toBeGreaterThan(fixedResult.summary.totalInterest)
    })

    it('should behave like variable rate when rateType is not mixed', () => {
      const variableResult = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360,
        rateType: 'variable'
      })

      const defaultResult = generateAmortizationTable({
        principal: 100000,
        tan: 0.03,
        termMonths: 360
      })

      expect(variableResult.summary.monthlyPayment).toBe(defaultResult.summary.monthlyPayment)
      expect(variableResult.summary.totalInterest).toBe(defaultResult.summary.totalInterest)
    })
  })
})
