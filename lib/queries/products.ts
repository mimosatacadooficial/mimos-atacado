import { db } from "@/lib/db"
import { products, productPriceTiers, categories, productCategories } from "@/lib/db/schema"
import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm"
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, MockCategory, MockProduct } from "@/lib/data/mock-data"

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

export async function getFeaturedProducts(limit = 8): Promise<ProductWithTiers[]> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_PRODUCTS.filter((p) => p.isFeatured && p.isActive).slice(0, limit) as unknown as ProductWithTiers[]
  }
  try {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit)

    if (rows.length > 0) {
      return (await attachTiers(rows)) as ProductWithTiers[]
    }
    return DEFAULT_PRODUCTS.filter((p) => p.isFeatured && p.isActive).slice(0, limit) as unknown as ProductWithTiers[]
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return DEFAULT_PRODUCTS.filter((p) => p.isFeatured && p.isActive).slice(0, limit) as unknown as ProductWithTiers[]
  }
}

export async function getAllActiveProducts(): Promise<ProductWithTiers[]> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_PRODUCTS.filter((p) => p.isActive) as unknown as ProductWithTiers[]
  }
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))

    if (rows.length > 0) {
      return (await attachTiers(rows)) as ProductWithTiers[]
    }
    return DEFAULT_PRODUCTS.filter((p) => p.isActive) as unknown as ProductWithTiers[]
  } catch (error) {
    console.error("Error fetching active products:", error)
    return DEFAULT_PRODUCTS.filter((p) => p.isActive) as unknown as ProductWithTiers[]
  }
}

export async function getProductsByCategorySlug(slug: string): Promise<{
  category: typeof categories.$inferSelect | MockCategory | null
  products: ProductWithTiers[]
}> {
  const fallbackCat = DEFAULT_CATEGORIES.find((c) => c.slug === slug) || null
  const fallbackProducts = DEFAULT_PRODUCTS.filter((p) => p.categorySlug === slug && p.isActive) as unknown as ProductWithTiers[]

  if (!process.env.DATABASE_URL) {
    return { category: fallbackCat, products: fallbackProducts }
  }
  try {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug))
    if (!category) {
      return { category: fallbackCat, products: fallbackProducts }
    }

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
    return { category, products: withTiers.length > 0 ? (withTiers as ProductWithTiers[]) : fallbackProducts }
  } catch (error) {
    console.error("Error fetching products by category:", error)
    return { category: fallbackCat, products: fallbackProducts }
  }
}

export async function searchProducts(query: string): Promise<ProductWithTiers[]> {
  const q = query.toLowerCase()
  const fallbackResults = DEFAULT_PRODUCTS.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
  ) as unknown as ProductWithTiers[]

  if (!process.env.DATABASE_URL) return fallbackResults

  try {
    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(ilike(products.name, `%${query}%`), ilike(products.description, `%${query}%`))
        )
      )
      .orderBy(desc(products.createdAt))
    const withTiers = await attachTiers(rows)
    return withTiers.length > 0 ? (withTiers as ProductWithTiers[]) : fallbackResults
  } catch (error) {
    console.error("Error searching products:", error)
    return fallbackResults
  }
}

export async function getProductBySlug(slug: string): Promise<ProductWithTiers | null> {
  const fallbackProduct = DEFAULT_PRODUCTS.find((p) => p.slug === slug) as unknown as ProductWithTiers | undefined

  if (!process.env.DATABASE_URL) return fallbackProduct ?? null

  try {
    const [product] = await db.select().from(products).where(eq(products.slug, slug))
    if (!product) return fallbackProduct ?? null
    const [withTiers] = await attachTiers([product])
    const [category] = await db.select().from(categories).where(eq(categories.id, product.categoryId))
    return { ...withTiers, categoryName: category?.name, categorySlug: category?.slug } as ProductWithTiers
  } catch (error) {
    console.error("Error fetching product by slug:", error)
    return fallbackProduct ?? null
  }
}

export async function getAllCategories(): Promise<(typeof categories.$inferSelect | MockCategory)[]> {
  if (!process.env.DATABASE_URL) return DEFAULT_CATEGORIES
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
    return rows.length > 0 ? rows : DEFAULT_CATEGORIES
  } catch (error) {
    console.error("Error fetching categories:", error)
    return DEFAULT_CATEGORIES
  }
}

/** Returns the applicable unit price in cents for a given quantity, using the highest tier threshold met. */
export function getUnitPriceForQuantity(product: ProductWithTiers, quantity: number) {
  const eligible = product.priceTiers
    .filter((t) => quantity >= t.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)
  return eligible[0]?.priceCents ?? product.basePriceCents
}
