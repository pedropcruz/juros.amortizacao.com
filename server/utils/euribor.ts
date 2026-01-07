import * as cheerio from 'cheerio'
import { eq, desc } from 'drizzle-orm'
import { useDatabase, schema } from './db'

export interface EuriborRates {
  rate3m: number
  rate6m: number
  rate12m: number
  date: string // YYYY-MM-DD
}

const EURIBOR_URL = 'https://www.euribor-rates.eu/en/current-euribor-rates.aspx'

/**
 * Fetches the latest Euribor rates by scraping euribor-rates.eu
 */
export async function fetchLatestEuriborRates(): Promise<EuriborRates> {
  try {
    const html = await $fetch<string>(EURIBOR_URL)
    const $ = cheerio.load(html)

    // The structure usually is a table with rates.
    // We look for the table containing "Euribor 3 months", etc.
    // Note: This relies on the specific DOM structure of the website.

    const rates: Partial<EuriborRates> = {}

    // Iterate through table rows
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td, th')
      const label = $(cells[0]).text().trim()

      // Value is in the second column (index 1)
      if (cells.length >= 2) {
        const valueText = $(cells[1]).text().trim().replace('%', '')
        const value = parseFloat(valueText)

        if (!isNaN(value)) {
          if (label.includes('Euribor 3 months')) rates.rate3m = value
          if (label.includes('Euribor 6 months')) rates.rate6m = value
          if (label.includes('Euribor 12 months')) rates.rate12m = value
        }
      }
    })

    // Try to find the date from the table header (2nd column usually has the latest date)
    const dateStr = $('table thead th').eq(1).text().trim()

    // Parse date (MM/DD/YYYY or DD/MM/YYYY depending on locale, usually MM/DD/YYYY on this site)
    // Example: "1/5/2026"
    let today: string

    if (dateStr) {
      const parts = dateStr.split('/')
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        // Assuming MM/DD/YYYY based on "1/5/2026" -> Jan 5th
        // Pad with 0
        const month = parts[0].padStart(2, '0')
        const day = parts[1].padStart(2, '0')
        const year = parts[2]
        today = `${year}-${month}-${day}`
      } else {
        today = new Date().toISOString().split('T')[0] as string
      }
    } else {
      today = new Date().toISOString().split('T')[0] as string
    }

    if (!today) throw new Error('Could not determine date')

    if (rates.rate3m === undefined || rates.rate6m === undefined || rates.rate12m === undefined) {
      throw new Error('Failed to extract all Euribor rates')
    }

    return {
      rate3m: rates.rate3m,
      rate6m: rates.rate6m,
      rate12m: rates.rate12m,
      date: today
    }
  } catch (error) {
    console.error('Error fetching Euribor rates:', error)
    throw new Error('Could not fetch Euribor rates')
  }
}

/**
 * Saves the rates to the database
 */
export async function saveEuriborRates(rates: EuriborRates) {
  const db = useDatabase()

  // Check if we already have rates for this date
  const existing = await db.query.euriborRates.findFirst({
    where: eq(schema.euriborRates.date, rates.date as string)
  })

  if (existing) {
    // Update existing
    await db.update(schema.euriborRates)
      .set({
        rate3m: rates.rate3m,
        rate6m: rates.rate6m,
        rate12m: rates.rate12m,
        // We assume fetched rates are "daily" not necessarily official monthly averages yet
        isOfficial: false
      })
      .where(eq(schema.euriborRates.date, rates.date as string))

    return { status: 'updated', date: rates.date }
  } else {
    // Insert new
    await db.insert(schema.euriborRates).values({
      date: rates.date,
      rate3m: rates.rate3m,
      rate6m: rates.rate6m,
      rate12m: rates.rate12m,
      isOfficial: false
    })

    return { status: 'created', date: rates.date }
  }
}

/**
 * Get the most recent rates from DB
 */
export async function getLatestStoredRates() {
  const db = useDatabase()

  return await db.query.euriborRates.findFirst({
    orderBy: [desc(schema.euriborRates.date)]
  })
}
