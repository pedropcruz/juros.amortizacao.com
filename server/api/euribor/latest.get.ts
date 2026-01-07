import { getLatestStoredRates, fetchLatestEuriborRates, saveEuriborRates } from '../../utils/euribor'

/**
 * Get latest Euribor rates
 * GET /api/euribor/latest
 */
export default defineEventHandler(async () => {
  try {
    // Try to get from DB first
    let rates = await getLatestStoredRates()

    // If no rates in DB or data is old (optional logic), fetch new ones
    // For now, if empty, we fetch
    if (!rates) {
      const freshRates = await fetchLatestEuriborRates()
      await saveEuriborRates(freshRates)
      rates = await getLatestStoredRates()
    }

    if (!rates) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Rates not available'
      })
    }

    return rates
  } catch (error) {
    console.error('Error getting latest rates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
