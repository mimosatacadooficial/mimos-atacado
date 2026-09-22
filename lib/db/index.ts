import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

const needsSsl =
  connectionString?.includes("sslmode=require") ||
  connectionString?.includes("neon.tech") ||
  connectionString?.includes("supabase.co") ||
  (process.env.NODE_ENV === "production" && !connectionString?.includes("localhost"))

export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
})
export const db = drizzle(pool, { schema })
