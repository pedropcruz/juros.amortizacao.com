import { eq, and } from 'drizzle-orm'
import { useDatabase, schema } from '../../utils/db'
import { auth } from '../../utils/auth'

/**
 * API endpoint for deleting a simulation
 * DELETE /api/simulations/:id
 * Requires authentication and ownership
 */

export default defineEventHandler(async (event) => {
  // Verify authentication
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autenticação necessária'
    })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da simulação é obrigatório'
    })
  }

  try {
    const db = useDatabase()

    // First verify the simulation belongs to the user
    const simulation = await db.query.simulations.findFirst({
      where: and(
        eq(schema.simulations.publicId, id),
        eq(schema.simulations.userId, session.user.id)
      )
    })

    if (!simulation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Simulação não encontrada'
      })
    }

    // Delete the simulation
    await db.delete(schema.simulations).where(
      and(
        eq(schema.simulations.publicId, id),
        eq(schema.simulations.userId, session.user.id)
      )
    )

    return {
      message: 'Simulação apagada com sucesso'
    }
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) {
      throw error
    }

    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao apagar simulação'
    })
  }
})
