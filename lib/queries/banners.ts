import { db } from "@/lib/db"
import { banners } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"
import { DEFAULT_BANNERS } from "@/lib/data/mock-data"

export async function getActiveBanners() {
  if (!process.env.DATABASE_URL) return DEFAULT_BANNERS
  try {
    const rows = await db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.sortOrder))
    return rows.length > 0 ? rows : DEFAULT_BANNERS
  } catch (error) {
    console.error("Error fetching active banners:", error)
    return DEFAULT_BANNERS
  }
}
