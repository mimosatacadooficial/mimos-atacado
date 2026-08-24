import { db } from "@/lib/db"
import { products, productPriceTiers, categories, productCategories } from "@/lib/db/schema"
import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm"

export type PriceTier = {
  minQuantity: number
  priceCents: number
}

export type ProductWithTiers = typeof products.$inferSelect & {
  priceTiers: PriceTier[]
  categoryName?: string
  categorySlug?: string
}

async function attachTiers(rows: (typeof products.$inferSelect)[]) {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const tiers = await db
    .select()
    .from(productPriceTiers)
    .where(
      ids.length === 1
        ? eq(productPriceTiers.productId, ids[0])
        : or(...ids.map((id) => eq(productPriceTiers.productId, id)))
    )
    .orderBy(asc(productPriceTiers.minQuantity))

  return rows.map((row) => ({
    ...row,
    priceTiers: tiers
      .filter((t) => t.productId === row.id)
      .map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents })),
  }))
}

export async function getFeaturedProducts(limit = 8) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit)
  return attachTiers(rows)
}

export async function getAllActiveProducts() {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
  return attachTiers(rows)
}

export async function getProductsByCategorySlug(slug: string) {
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug))
  if (!category) return { category: null, products: [] as ProductWithTiers[] }

  const links = await db
    .select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, category.id))
  const linkedIds = links.map((l) => l.productId)

  const categoryMatch =
    linkedIds.length > 0
      ? or(eq(products.categoryId, category.id), inArray(products.id, linkedIds))
      : eq(products.categoryId, category.id)

  const rows = await db
    .select()
    .from(products)
    .where(and(categoryMatch, eq(products.isActive, true)))
    .orderBy(desc(products.createdAt))
  const withTiers = await attachTiers(rows)
  return { category, products: withTiers }
}

export async function searchProducts(query: string) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), ilike(products.name, `%${query}%`)))
    .orderBy(desc(products.createdAt))
  return attachTiers(rows)
}

export async function getProductBySlug(slug: string) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug))
  if (!product) return null
  const [withTiers] = await attachTiers([product])
  const [category] = await db.select().from(categories).where(eq(categories.id, product.categoryId))
  return { ...withTiers, categoryName: category?.name, categorySlug: category?.slug }
}

export async function getAllCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder))
}

/** Returns the applicable unit price in cents for a given quantity, using the highest tier threshold met. */
export function getUnitPriceForQuantity(product: ProductWithTiers, quantity: number) {
  const eligible = product.priceTiers
    .filter((t) => quantity >= t.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)
  return eligible[0]?.priceCents ?? product.basePriceCents
}
