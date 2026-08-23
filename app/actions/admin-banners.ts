"use server"

import { db } from "@/lib/db"
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
  await db.insert(banners).values(input)
  revalidatePath("/admin/banners")
  revalidatePath("/")
}

export async function updateBanner(id: number, input: BannerInput) {
  await db.update(banners).set(input).where(eq(banners.id, id))
  revalidatePath("/admin/banners")
  revalidatePath("/")
}

export async function deleteBanner(id: number) {
  await db.delete(banners).where(eq(banners.id, id))
  revalidatePath("/admin/banners")
  revalidatePath("/")
}
