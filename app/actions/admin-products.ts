"use server"

import { db } from "@/lib/db"
import { products, productPriceTiers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type PriceTierInput = { minQuantity: number; priceCents: number }

export type ProductInput = {
  categoryId: number
  name: string
  slug: string
  description: string
  basePriceCents: number
  compareAtPriceCents: number | null
  images: string[]
  stock: number
  minQuantity: number
  isActive: boolean
  isFeatured: boolean
  sku: string
  priceTiers: PriceTierInput[]
}

export async function createProduct(input: ProductInput) {
  const [created] = await db
    .insert(products)
    .values({
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      basePriceCents: input.basePriceCents,
      compareAtPriceCents: input.compareAtPriceCents,
      images: input.images,
      stock: input.stock,
      minQuantity: input.minQuantity,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sku: input.sku || null,
    })
    .returning({ id: products.id })

  if (input.priceTiers.length > 0) {
    await db.insert(productPriceTiers).values(
      input.priceTiers.map((tier) => ({
        productId: created.id,
        minQuantity: tier.minQuantity,
        priceCents: tier.priceCents,
      })),
    )
  }

  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
  redirect("/admin/produtos")
}

export async function updateProduct(id: number, input: ProductInput) {
  await db
    .update(products)
    .set({
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      basePriceCents: input.basePriceCents,
      compareAtPriceCents: input.compareAtPriceCents,
      images: input.images,
      stock: input.stock,
      minQuantity: input.minQuantity,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sku: input.sku || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))

  await db.delete(productPriceTiers).where(eq(productPriceTiers.productId, id))
  if (input.priceTiers.length > 0) {
    await db.insert(productPriceTiers).values(
      input.priceTiers.map((tier) => ({
        productId: id,
        minQuantity: tier.minQuantity,
        priceCents: tier.priceCents,
      })),
    )
  }

  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
  revalidatePath(`/produto/${input.slug}`)
  redirect("/admin/produtos")
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id))
  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
}

export async function getProductWithTiers(id: number) {
  const [product] = await db.select().from(products).where(eq(products.id, id))
  if (!product) return null
  const tiers = await db
    .select()
    .from(productPriceTiers)
    .where(eq(productPriceTiers.productId, id))
    .orderBy(productPriceTiers.minQuantity)
  return { product, tiers }
}
