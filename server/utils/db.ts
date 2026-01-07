import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL

// Create postgres client - lazy initialization
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDatabase() {
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  if (!db) {
    const client = postgres(connectionString)
    db = drizzle(client, { schema })
  }

  return db
}

export { schema }
