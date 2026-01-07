import { fetchLatestEuriborRates, saveEuriborRates } from '../../utils/euribor'

/**
 * Cron endpoint to update Euribor rates
 * GET /api/cron/update-rates
 * Should be protected with a secret key in production
 */
export default defineEventHandler(async (event) => {
  try {
    // 1. Fetch rates
    const rates = await fetchLatestEuriborRates()

    // 2. Save to DB
    const result = await saveEuriborRates(rates)

    return {
      success: true,
      data: rates,
      operation: result.status
    }
  } catch (error) {
    console.error('Cron job failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update rates'
    })
  }
})
