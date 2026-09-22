"use server"

import { db, isDatabaseConfigured } from "@/lib/db"
import { banners } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type BannerInput = {
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  sortOrder: number
  isActive: boolean
}

export async function createBanner(input: BannerInput) {
  if (isDatabaseConfigured()) {
    try {
      await db.insert(banners).values(input)
    } catch (err) {
      console.warn("Could not insert banner in database:", err)
    }
  }
  revalidatePath("/admin/banners")
  revalidatePath("/")
}

export async function updateBanner(id: number, input: BannerInput) {
  if (isDatabaseConfigured()) {
    try {
      await db.update(banners).set(input).where(eq(banners.id, id))
    } catch (err) {
      console.warn("Could not update banner in database:", err)
    }
  }
  revalidatePath("/admin/banners")
  revalidatePath("/")
}

export async function deleteBanner(id: number) {
  if (isDatabaseConfigured()) {
    try {
      await db.delete(banners).where(eq(banners.id, id))
    } catch (err) {
      console.warn("Could not delete banner in database:", err)
    }
  }
  revalidatePath("/admin/banners")
  revalidatePath("/")
}

