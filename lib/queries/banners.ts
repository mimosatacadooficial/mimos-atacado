import { db } from "@/lib/db"
import { banners } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"

export async function getActiveBanners() {
  if (!process.env.DATABASE_URL) return []
  try {
    return await db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.sortOrder))
  } catch (error) {
    console.error("Error fetching active banners:", error)
    return []
  }
}
