import { db } from "@/lib/db"
import { banners } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"

export async function getActiveBanners() {
  return db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.sortOrder))
}
