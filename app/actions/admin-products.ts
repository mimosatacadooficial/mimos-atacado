"use server"

import { db } from "@/lib/db"
import { products, productPriceTiers, productCategories } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type PriceTierInput = { minQuantity: number; priceCents: number }

export type ProductInput = {
  categoryIds: number[]
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
      categoryId: input.categoryIds[0],
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

  if (input.categoryIds.length > 0) {
    await db.insert(productCategories).values(
      input.categoryIds.map((categoryId) => ({
        productId: created.id,
        categoryId,
      })),
    )
  }

  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
  return { id: created.id }
}

export async function updateProduct(id: number, input: ProductInput) {
  await db
    .update(products)
    .set({
      categoryId: input.categoryIds[0],
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

  await db.delete(productCategories).where(eq(productCategories.productId, id))
  if (input.categoryIds.length > 0) {
    await db.insert(productCategories).values(
      input.categoryIds.map((categoryId) => ({
        productId: id,
        categoryId,
      })),
    )
  }

  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
  revalidatePath(`/produto/${input.slug}`)
  return { id }
}

export async function deleteProduct(id: number) {
  await db.delete(productPriceTiers).where(eq(productPriceTiers.productId, id))
  await db.delete(productCategories).where(eq(productCategories.productId, id))
  await db.delete(products).where(eq(products.id, id))
  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
}

import { DEFAULT_PRODUCTS } from "@/lib/data/mock-data"

export async function getProductWithTiers(id: number) {
  if (process.env.DATABASE_URL) {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id))
      if (product) {
        const tiers = await db
          .select()
          .from(productPriceTiers)
          .where(eq(productPriceTiers.productId, id))
          .orderBy(productPriceTiers.minQuantity)
        const categoryLinks = await db
          .select({ categoryId: productCategories.categoryId })
          .from(productCategories)
          .where(eq(productCategories.productId, id))
        const categoryIds = categoryLinks.length > 0 ? categoryLinks.map((c) => c.categoryId) : [product.categoryId]
        return { product, tiers, categoryIds }
      }
    } catch (error) {
      console.error("Error fetching product with tiers:", error)
    }
  }

  const mock = DEFAULT_PRODUCTS.find((p) => p.id === id)
  if (!mock) return null
  return {
    product: mock,
    tiers: mock.priceTiers.map((t, idx) => ({
      id: idx + 1,
      productId: mock.id,
      minQuantity: t.minQuantity,
      priceCents: t.priceCents,
      createdAt: new Date(),
    })),
    categoryIds: [mock.categoryId],
  }
}
