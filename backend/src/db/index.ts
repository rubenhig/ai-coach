import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function runMigrations(): Promise<void> {
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 })
  const migrationDb = drizzle(migrationClient)
  await migrate(migrationDb, {
    migrationsFolder: join(__dirname, '../../drizzle'),
  })
  await migrationClient.end()
}
