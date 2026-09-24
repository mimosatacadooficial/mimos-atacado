import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { db, isDatabaseConfigured } from "@/lib/db"
import { products, productCategories, productPriceTiers, categories, orderItems } from "@/lib/db/schema"
import { eq, desc, asc, inArray } from "drizzle-orm"
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from "@/lib/data/mock-data"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "3ba2d09cbe5f5e41c662f0cfcd389688"
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "8ea963a0b1825e501dccf4de5d90c15b"
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "2870c78f0976edac2cc4f98e016cad1b52d85885385bfe11fe326f8e1ab27d88"
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "mimos-atacado"
const CATALOG_KEY = "data/catalog.json"

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

export interface CatalogPriceTier {
  id?: number
  minQuantity: number
  priceCents: number
}

export interface CatalogProduct {
  id: number
  categoryId: number
  categoryName: string
  categorySlug: string
  categoryIds: number[]
  categoryNames: string[]
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
  priceTiers: CatalogPriceTier[]
  createdAt: string
  updatedAt: string
}

export interface CatalogCategory {
  id: number
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  sortOrder: number
}

export interface CatalogData {
  version: number
  initialized: boolean
  updatedAt: string
  categories: CatalogCategory[]
  products: CatalogProduct[]
}

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


// In-memory cache for ultra-fast server rendering (10 minutes with instant invalidation on admin edits)
let memoryCatalog: CatalogData | null = null
let lastFetchedAt = 0
let pendingCatalogPromise: Promise<CatalogData> | null = null
const CACHE_TTL_MS = 1000 * 60 * 10 // 10 minutes

export function invalidateCatalogCache(): void {
  memoryCatalog = null
  lastFetchedAt = 0
  pendingCatalogPromise = null
}

function buildDefaultCatalog(): CatalogData {
  const initialCategories: CatalogCategory[] = DEFAULT_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || null,
    imageUrl: c.imageUrl || null,
    sortOrder: c.sortOrder,
  }))

  const initialProducts: CatalogProduct[] = DEFAULT_PRODUCTS.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    categorySlug: p.categorySlug,
    categoryIds: [p.categoryId],
    categoryNames: [p.categoryName],
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
    sku: p.sku,
    priceTiers: p.priceTiers.map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  return {
    version: 1,
    initialized: true,
    updatedAt: new Date().toISOString(),
    categories: initialCategories,
    products: initialProducts,
  }
}

/**
 * Reads the catalog from Cloudflare R2 cloud storage.
 * If it doesn't exist, initializes it with the default catalog and stores it in R2.
 */
async function readCatalogFromR2(): Promise<CatalogData> {
  try {
    const cmd = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: CATALOG_KEY,
    })
    const res = await s3Client.send(cmd)
    const jsonStr = await res.Body?.transformToString()
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr) as CatalogData
      if (Array.isArray(parsed.products) && Array.isArray(parsed.categories)) {
        return parsed
      }
    }
  } catch (err: any) {
    if (err.name !== "NoSuchKey" && err.$metadata?.httpStatusCode !== 404) {
      console.warn("R2 catalog read warning:", err.message)
    }
  }

  // Not found in R2: initialize and save
  const defaultCatalog = buildDefaultCatalog()
  await writeCatalogToR2(defaultCatalog)
  return defaultCatalog
}

/**
 * Writes the catalog to Cloudflare R2 cloud storage.
 */
async function writeCatalogToR2(catalog: CatalogData): Promise<void> {
  try {
    catalog.updatedAt = new Date().toISOString()
    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: CATALOG_KEY,
      Body: JSON.stringify(catalog, null, 2),
      ContentType: "application/json",
      CacheControl: "no-cache",
    })
    await s3Client.send(cmd)
    memoryCatalog = catalog
    lastFetchedAt = Date.now()
  } catch (err: any) {
    console.error("Failed to write catalog to R2:", err.message)
  }
}

async function fetchCatalogInternal(): Promise<CatalogData> {
  const now = Date.now()

  // Check PostgreSQL first if configured
  if (isDatabaseConfigured()) {
    try {
      const dbCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder))
      const dbProducts = await db.select().from(products).orderBy(desc(products.createdAt))

      if (dbProducts.length > 0) {
        // We have active products in Postgres
        const pIds = dbProducts.map((p) => p.id)
        const allTiers =
          pIds.length > 0
            ? await db
                .select()
                .from(productPriceTiers)
                .where(inArray(productPriceTiers.productId, pIds))
                .orderBy(asc(productPriceTiers.minQuantity))
            : []

        const allCatLinks =
          pIds.length > 0
            ? await db
                .select({
                  productId: productCategories.productId,
                  categoryId: productCategories.categoryId,
                })
                .from(productCategories)
                .where(inArray(productCategories.productId, pIds))
            : []

        const mappedCategories: CatalogCategory[] = dbCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl,
          sortOrder: c.sortOrder,
        }))

        const catMap = new Map(mappedCategories.map((c) => [c.id, c]))

        const mappedProducts: CatalogProduct[] = dbProducts.map((p) => {
          const links = allCatLinks.filter((l) => l.productId === p.id).map((l) => l.categoryId)
          const primaryCat = catMap.get(p.categoryId)
          const catNames = links.map((id) => catMap.get(id)?.name || "").filter(Boolean)

          return {
            id: p.id,
            categoryId: p.categoryId,
            categoryName: primaryCat?.name || "Geral",
            categorySlug: primaryCat?.slug || "geral",
            categoryIds: links.length > 0 ? links : [p.categoryId],
            categoryNames: catNames.length > 0 ? catNames : [primaryCat?.name || "Geral"],
            name: p.name,
            slug: p.slug,
            description: p.description || "",
            basePriceCents: p.basePriceCents,
            compareAtPriceCents: p.compareAtPriceCents,
            images: p.images || [],
            stock: p.stock,
            minQuantity: p.minQuantity,
            isActive: p.isActive,
            isFeatured: p.isFeatured,
            sku: p.sku || "",
            priceTiers: allTiers
              .filter((t) => t.productId === p.id)
              .map((t) => ({ id: t.id, minQuantity: t.minQuantity, priceCents: t.priceCents })),
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
          }
        })

        const result: CatalogData = {
          version: 1,
          initialized: true,
          updatedAt: new Date().toISOString(),
          categories: mappedCategories,
          products: mappedProducts,
        }

        memoryCatalog = result
        lastFetchedAt = now
        // Sync back to R2 in background
        writeCatalogToR2(result).catch(() => {})
        return result
      }
    } catch (dbErr: any) {
      console.warn("PostgreSQL read warning, using R2 storage:", dbErr.message)
    }
  }

  // Fallback to Cloudflare R2 cloud storage
  const r2Catalog = await readCatalogFromR2()
  memoryCatalog = r2Catalog
  lastFetchedAt = now
  return r2Catalog
}

/**
 * Gets the current catalog, combining PostgreSQL (if active) and Cloudflare R2 persistent storage.
 * Uses in-memory caching with single-flight deduplication to avoid redundant roundtrips.
 */
export async function getCatalog(forceRefresh = false): Promise<CatalogData> {
  const now = Date.now()
  if (!forceRefresh && memoryCatalog && now - lastFetchedAt < CACHE_TTL_MS) {
    return memoryCatalog
  }

  if (pendingCatalogPromise && !forceRefresh) {
    return pendingCatalogPromise
  }

  pendingCatalogPromise = fetchCatalogInternal().finally(() => {
    pendingCatalogPromise = null
  })

  return pendingCatalogPromise
}

/**
 * Returns all products for the admin table.
 */
export async function getAdminProducts(): Promise<{
  id: number
  name: string
  slug: string
  basePriceCents: number
  stock: number
  isActive: boolean
  isFeatured: boolean
  categoryName: string | null
  images: string[]
  categoryNames: string[]
}[]> {
  const catalog = await getCatalog()
  return catalog.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePriceCents: p.basePriceCents,
    stock: p.stock,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    categoryName: p.categoryName || null,
    images: p.images,
    categoryNames: p.categoryNames?.length ? p.categoryNames : [p.categoryName].filter(Boolean),
  }))
}

/**
 * Returns all active categories.
 */
export async function getAdminCategories(): Promise<CatalogCategory[]> {
  const catalog = await getCatalog()
  return catalog.categories
}

/**
 * Returns a single product with its price tiers and category links for editing.
 */
export async function getProductWithTiers(id: number): Promise<{
  product: any
  tiers: CatalogPriceTier[]
  categoryIds: number[]
} | null> {
  const catalog = await getCatalog()
  const found = catalog.products.find((p) => p.id === id)
  if (!found) return null

  return {
    product: {
      id: found.id,
      categoryId: found.categoryId,
      name: found.name,
      slug: found.slug,
      description: found.description,
      basePriceCents: found.basePriceCents,
      compareAtPriceCents: found.compareAtPriceCents,
      images: found.images,
      stock: found.stock,
      minQuantity: found.minQuantity,
      isActive: found.isActive,
      isFeatured: found.isFeatured,
      sku: found.sku,
      categoryName: found.categoryName,
      categorySlug: found.categorySlug,
    },
    tiers: found.priceTiers,
    categoryIds: found.categoryIds?.length ? found.categoryIds : [found.categoryId],
  }
}

/**
 * Permanently deletes a product from the database and server storage.
 */
export async function deleteCatalogProduct(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. If PostgreSQL is configured, delete from database tables
    if (isDatabaseConfigured()) {
      try {
        // Disassociate order items to prevent foreign key errors
        await db.update(orderItems).set({ productId: null }).where(eq(orderItems.productId, id))
        await db.delete(productPriceTiers).where(eq(productPriceTiers.productId, id))
        await db.delete(productCategories).where(eq(productCategories.productId, id))
        await db.delete(products).where(eq(products.id, id))
      } catch (dbErr: any) {
        console.warn("PostgreSQL delete warning:", dbErr.message)
      }
    }

    // 2. Delete from R2 persistent storage
    const catalog = await getCatalog(true)
    const initialCount = catalog.products.length
    catalog.products = catalog.products.filter((p) => p.id !== id)

    await writeCatalogToR2(catalog)
    memoryCatalog = catalog
    lastFetchedAt = Date.now()

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting product from server:", error)
    return { success: false, error: error?.message || "Erro ao excluir o produto do servidor." }
  }
}

/**
 * Creates a new product in the database and server storage.
 */
export async function createCatalogProduct(input: ProductInput): Promise<{ id: number }> {
  const catalog = await getCatalog(true)

  // Generate new unique ID
  const maxId = catalog.products.reduce((max, p) => (p.id > max ? p.id : max), 0)
  const newId = maxId + 1

  const primaryCatId = input.categoryIds[0] || 1
  const primaryCat = catalog.categories.find((c) => c.id === primaryCatId)
  const catNames = input.categoryIds
    .map((cid) => catalog.categories.find((c) => c.id === cid)?.name || "")
    .filter(Boolean)

  let createdId = newId

  // 1. Insert into PostgreSQL if configured
  if (isDatabaseConfigured()) {
    try {
      const [created] = await db
        .insert(products)
        .values({
          categoryId: primaryCatId,
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

      if (created?.id) {
        createdId = created.id

        if (input.priceTiers.length > 0) {
          await db.insert(productPriceTiers).values(
            input.priceTiers.map((tier) => ({
              productId: createdId,
              minQuantity: tier.minQuantity,
              priceCents: tier.priceCents,
            }))
          )
        }

        if (input.categoryIds.length > 0) {
          await db.insert(productCategories).values(
            input.categoryIds.map((categoryId) => ({
              productId: createdId,
              categoryId,
            }))
          )
        }
      }
    } catch (dbErr: any) {
      console.warn("PostgreSQL create product warning:", dbErr.message)
    }
  }

  // 2. Add to R2 persistent storage
  const newProduct: CatalogProduct = {
    id: createdId,
    categoryId: primaryCatId,
    categoryName: primaryCat?.name || "Geral",
    categorySlug: primaryCat?.slug || "geral",
    categoryIds: input.categoryIds,
    categoryNames: catNames.length > 0 ? catNames : [primaryCat?.name || "Geral"],
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
    sku: input.sku,
    priceTiers: input.priceTiers.map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Remove any conflicting ID then prepend
  catalog.products = [newProduct, ...catalog.products.filter((p) => p.id !== createdId)]
  await writeCatalogToR2(catalog)
  memoryCatalog = catalog
  lastFetchedAt = Date.now()

  return { id: createdId }
}

/**
 * Updates an existing product in the database and server storage.
 */
export async function updateCatalogProduct(id: number, input: ProductInput): Promise<{ id: number }> {
  const catalog = await getCatalog(true)
  const primaryCatId = input.categoryIds[0] || 1
  const primaryCat = catalog.categories.find((c) => c.id === primaryCatId)
  const catNames = input.categoryIds
    .map((cid) => catalog.categories.find((c) => c.id === cid)?.name || "")
    .filter(Boolean)

  // 1. Update in PostgreSQL if configured
  if (isDatabaseConfigured()) {
    try {
      await db
        .update(products)
        .set({
          categoryId: primaryCatId,
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
          }))
        )
      }

      await db.delete(productCategories).where(eq(productCategories.productId, id))
      if (input.categoryIds.length > 0) {
        await db.insert(productCategories).values(
          input.categoryIds.map((categoryId) => ({
            productId: id,
            categoryId,
          }))
        )
      }
    } catch (dbErr: any) {
      console.warn("PostgreSQL update product warning:", dbErr.message)
    }
  }

  // 2. Update in R2 persistent storage
  const existingIndex = catalog.products.findIndex((p) => p.id === id)
  const updatedProduct: CatalogProduct = {
    id,
    categoryId: primaryCatId,
    categoryName: primaryCat?.name || "Geral",
    categorySlug: primaryCat?.slug || "geral",
    categoryIds: input.categoryIds,
    categoryNames: catNames.length > 0 ? catNames : [primaryCat?.name || "Geral"],
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
    sku: input.sku,
    priceTiers: input.priceTiers.map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents })),
    createdAt: existingIndex >= 0 ? catalog.products[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    catalog.products[existingIndex] = updatedProduct
  } else {
    catalog.products.unshift(updatedProduct)
  }

  await writeCatalogToR2(catalog)
  memoryCatalog = catalog
  lastFetchedAt = Date.now()

  return { id }
}
