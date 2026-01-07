import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AmortizationRow {
  paymentNumber: number
  installment: number
  interest: number
  principal: number
  stampDuty: number
  insurance: number
  totalPayment: number
  remainingBalance: number
}

interface SimulationData {
  id: string
  name: string
  loanAmount: number
  interestRate: number
  euribor: number | null
  spread: number | null
  termMonths: number
  stampDutyRate: number
  insuranceRate: number
  rateType?: 'variable' | 'fixed' | 'mixed'
  euriborPeriod?: '3m' | '6m' | '12m'
  amortizationTable: AmortizationRow[]
  summary: {
    monthlyPayment: number
    totalPayment: number
    totalInterest: number
    totalStampDuty: number
    totalInsurance: number
    effectiveRate: number
  }
  createdAt: string
}

export function usePdfExport() {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatRateType = (type?: string): string => {
    switch (type) {
      case 'variable': return 'Variável'
      case 'fixed': return 'Fixa'
      case 'mixed': return 'Mista'
      default: return 'Variável'
    }
  }

  const _formatEuriborPeriod = (period?: string): string => {
    switch (period) {
      case '3m': return '3 meses'
      case '6m': return '6 meses'
      case '12m': return '12 meses'
      default: return '6 meses'
    }
  }

  const formatTermYears = (months: number): string => {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) {
      return `${years} anos`
    }
    return `${years} anos e ${remainingMonths} meses`
  }

  const exportSimulationPdf = (simulation: SimulationData, includeFullTable = false) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPos = 20

    // Colors
    const primaryColor: [number, number, number] = [40, 40, 40] // Dark Gray (neutral)
    const textColor: [number, number, number] = [31, 41, 55] // Gray-800
    const mutedColor: [number, number, number] = [107, 114, 128] // Gray-500

    // Simple Text Header (No Brand)
    doc.setTextColor(...textColor)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(simulation.name || 'Simulação de Crédito Habitação', 20, yPos)

    // Date on the right
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...mutedColor)
    doc.text(new Date().toLocaleDateString('pt-PT'), pageWidth - 20, yPos, { align: 'right' })

    yPos += 8
    doc.setFontSize(10)
    doc.text(`Criada em ${formatDate(simulation.createdAt)}`, 20, yPos)

    yPos += 15

    // Executive Summary - Compact List
    doc.setTextColor(...textColor)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo', 20, yPos)

    yPos += 6

    // Draw a simple line under header
    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPos, pageWidth - 20, yPos)

    yPos += 10

    // Summary Grid - More compact
    const summaryData = [
      ['Prestação Mensal', formatCurrency(simulation.summary.monthlyPayment)],
      ['Total a Pagar (MTIC)', formatCurrency(simulation.summary.totalPayment)],
      ['Total de Juros', formatCurrency(simulation.summary.totalInterest)],
      ['Taxa Efetiva (TAEG)', `${simulation.summary.effectiveRate.toFixed(2)}%`]
    ]

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2, // Reduced padding
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { fontStyle: 'normal', textColor: mutedColor, cellWidth: 60 },
        1: { fontStyle: 'bold', textColor: textColor }
      },
      margin: { left: 20, right: 20 }
    })

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // Loan Parameters Section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textColor)
    doc.text('Parâmetros', 20, yPos)

    yPos += 6
    doc.line(20, yPos, pageWidth - 20, yPos)
    yPos += 8

    // Parameters table
    const paramsData = [
      ['Montante', formatCurrency(simulation.loanAmount)],
      ['Prazo', formatTermYears(simulation.termMonths)],
      ['Taxa (TAN)', `${(simulation.interestRate * 100).toFixed(3)}%`],
      ['Tipo de Taxa', formatRateType(simulation.rateType)]
    ]

    if (simulation.euribor !== null && simulation.spread !== null) {
      paramsData.push(['Euribor + Spread', `${simulation.euribor}% + ${simulation.spread}%`])
    }

    paramsData.push(
      ['Imposto do Selo', `${(simulation.stampDutyRate * 100).toFixed(1)}%`],
      ['Seguro de Vida', `${(simulation.insuranceRate * 100).toFixed(3)}%`]
    )

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: paramsData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2
      },
      columnStyles: {
        0: { fontStyle: 'normal', textColor: mutedColor, cellWidth: 60 },
        1: { fontStyle: 'bold', textColor: textColor }
      },
      margin: { left: 20, right: 20 }
    })

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // Amortization Table
    if (includeFullTable) {
      doc.addPage()
      yPos = 20

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textColor)
      doc.text('Tabela de Amortização', 20, yPos)
      yPos += 10

      const tableData = simulation.amortizationTable.map(row => [
        row.paymentNumber.toString(),
        formatCurrency(row.installment),
        formatCurrency(row.interest),
        formatCurrency(row.principal),
        formatCurrency(row.totalPayment),
        formatCurrency(row.remainingBalance)
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Mês', 'Prestação', 'Juros', 'Capital', 'Total', 'Saldo']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 15, right: 15 }
      })
    } else {
      // Annual summary table
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textColor)
      doc.text('Resumo Anual', 20, yPos)

      yPos += 6
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 8

      // Group by year
      const annualData: { [key: number]: { interest: number, principal: number, total: number, balance: number } } = {}

      simulation.amortizationTable.forEach((row) => {
        const year = Math.ceil(row.paymentNumber / 12)
        if (!annualData[year]) {
          annualData[year] = { interest: 0, principal: 0, total: 0, balance: 0 }
        }
        annualData[year].interest += row.interest
        annualData[year].principal += row.principal
        annualData[year].total += row.totalPayment
        annualData[year].balance = row.remainingBalance
      })

      const tableData = Object.entries(annualData).map(([year, data]) => [
        `Ano ${year}`,
        formatCurrency(data.interest),
        formatCurrency(data.principal),
        formatCurrency(data.total),
        formatCurrency(data.balance)
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Período', 'Juros', 'Capital', 'Total Pago', 'Saldo Final']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: primaryColor, // Neutral dark gray
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      })
    }

    // Minimal Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const pageHeight = doc.internal.pageSize.getHeight()

      doc.setFontSize(8)
      doc.setTextColor(...mutedColor)
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: 'right' }
      )
    }

    // Generate filename
    const safeName = (simulation.name || 'simulacao')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30)
    const date = new Date().toISOString().split('T')[0]
    const filename = `simulacao-${safeName}-${date}.pdf` // Removed "juros-" prefix

    // Download
    doc.save(filename)

    return filename
  }

  return {
    exportSimulationPdf
  }
}
