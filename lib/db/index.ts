import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!url) return false
  if (url.includes("usuario:senha@host")) return false
  if (url.includes("example.com")) return false
  if (url.includes("sua_database_url")) return false
  return url.startsWith("postgres://") || url.startsWith("postgresql://")
}

const rawConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
const connectionString = isDatabaseConfigured() ? rawConnectionString : undefined

const needsSsl =
  connectionString?.includes("sslmode=require") ||
  connectionString?.includes("neon.tech") ||
  connectionString?.includes("supabase.co") ||
  (process.env.NODE_ENV === "production" && !connectionString?.includes("localhost"))

export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 4000,
})
export const db = drizzle(pool, { schema })

