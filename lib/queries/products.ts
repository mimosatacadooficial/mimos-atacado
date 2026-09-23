import { getCatalog, type CatalogProduct } from "@/lib/catalog"
import { products } from "@/lib/db/schema"
import { MockCategory } from "@/lib/data/mock-data"

export type PriceTier = {
  minQuantity: number
  priceCents: number
}

export type ProductWithTiers = typeof products.$inferSelect & {
  priceTiers: PriceTier[]
  categoryName?: string
  categorySlug?: string
  categoryIds?: number[]
  categoryNames?: string[]
}

function mapCatalogProductToStore(p: CatalogProduct): ProductWithTiers {
  return {
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    basePriceCents: p.basePriceCents,
    compareAtPriceCents: p.compareAtPriceCents,
    images: p.images,
    stock: p.stock,
    minQuantity: p.minQuantity,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    sku: p.sku || null,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
    priceTiers: p.priceTiers.map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents })),
    categoryName: p.categoryName,
    categorySlug: p.categorySlug,
    categoryIds: p.categoryIds,
    categoryNames: p.categoryNames,
  }
}

export async function getFeaturedProducts(limit = 8): Promise<ProductWithTiers[]> {
  try {
    const catalog = await getCatalog()
    return catalog.products
      .filter((p) => p.isActive && p.isFeatured)
      .slice(0, limit)
      .map(mapCatalogProductToStore)
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
}

export async function getAllActiveProducts(): Promise<ProductWithTiers[]> {
  try {
    const catalog = await getCatalog()
    return catalog.products
      .filter((p) => p.isActive)
      .map(mapCatalogProductToStore)
  } catch (error) {
    console.error("Error fetching active products:", error)
    return []
  }
}

export async function getProductsByCategorySlug(slug: string): Promise<{
  category: MockCategory | null
  products: ProductWithTiers[]
}> {
  try {
    const catalog = await getCatalog()
    const cat = catalog.categories.find((c) => c.slug === slug) || null

    if (!cat) {
      return { category: null, products: [] }
    }

    const matchingProducts = catalog.products
      .filter((p) => {
        if (!p.isActive) return false
        if (p.categorySlug === slug) return true
        if (p.categoryIds && p.categoryIds.includes(cat.id)) return true
        return false
      })
      .map(mapCatalogProductToStore)

    return {
      category: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        createdAt: new Date(),
      },
      products: matchingProducts,
    }
  } catch (error) {
    console.error("Error fetching products by category:", error)
    return { category: null, products: [] }
  }
}

export async function searchProducts(query: string): Promise<ProductWithTiers[]> {
  try {
    const q = query.toLowerCase().trim()
    if (!q) return getAllActiveProducts()

    const catalog = await getCatalog()
    return catalog.products
      .filter(
        (p) =>
          p.isActive &&
          (p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.categoryNames && p.categoryNames.some((c) => c.toLowerCase().includes(q))))
      )
      .map(mapCatalogProductToStore)
  } catch (error) {
    console.error("Error searching products:", error)
    return []
  }
}

const SLUG_ALIASES: Record<string, string> = {
  "base-liquida-matte": "kit-de-maquiagem-38-itens-com-acessorios-extras-para-revender",
  "paleta-sombras-12-cores": "kit-de-maquiagem-40-itens-para-revender",
}

export async function getProductBySlug(slug: string): Promise<ProductWithTiers | null> {
  try {
    const cleanSlug = slug.trim().toLowerCase()
    const targetSlug = SLUG_ALIASES[cleanSlug] || cleanSlug
    const catalog = await getCatalog()
    const found =
      catalog.products.find((p) => p.slug.toLowerCase() === targetSlug) ||
      catalog.products.find((p) => p.slug.toLowerCase() === cleanSlug)
    if (!found) return null
    return mapCatalogProductToStore(found)
  } catch (error) {
    console.error("Error fetching product by slug:", error)
    return null
  }
}

export async function getAllCategories(): Promise<MockCategory[]> {
  try {
    const catalog = await getCatalog()
    return catalog.categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      createdAt: new Date(),
    }))
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

/** Returns the applicable unit price in cents for a given quantity, using the highest tier threshold met. */
export function getUnitPriceForQuantity(product: ProductWithTiers, quantity: number) {
  const eligible = product.priceTiers
    .filter((t) => quantity >= t.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)
  return eligible[0]?.priceCents ?? product.basePriceCents
}
