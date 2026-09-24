import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import type { ProductReview, ProductRatingSummary } from "./types"
import { DEFAULT_REVIEWS } from "./seed-data"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "3ba2d09cbe5f5e41c662f0cfcd389688"
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "8ea963a0b1825e501dccf4de5d90c15b"
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "2870c78f0976edac2cc4f98e016cad1b52d85885385bfe11fe326f8e1ab27d88"
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "mimos-atacado"
const REVIEWS_KEY = "data/reviews.json"

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

// In-memory cache for ultra-fast SSR
let memoryReviews: ProductReview[] | null = null
let lastFetchedAt = 0
let pendingReviewsPromise: Promise<ProductReview[]> | null = null
const CACHE_TTL_MS = 1000 * 60 * 10 // 10 minutes

export function invalidateReviewsCache(): void {
  memoryReviews = null
  lastFetchedAt = 0
  pendingReviewsPromise = null
}

async function readReviewsFromR2(): Promise<ProductReview[]> {
  try {
    const cmd = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: REVIEWS_KEY,
    })
    const res = await s3Client.send(cmd)
    const jsonStr = await res.Body?.transformToString()
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr) as ProductReview[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err: any) {
    if (err.name !== "NoSuchKey" && err.$metadata?.httpStatusCode !== 404) {
      console.warn("R2 reviews read warning:", err.message)
    }
  }

  // Not found in R2 or empty: initialize with default reviews and save
  const seeded = [...DEFAULT_REVIEWS]
  await writeReviewsToR2(seeded)
  return seeded
}

async function writeReviewsToR2(reviews: ProductReview[]): Promise<void> {
  try {
    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: REVIEWS_KEY,
      Body: JSON.stringify(reviews, null, 2),
      ContentType: "application/json",
      CacheControl: "no-cache",
    })
    await s3Client.send(cmd)
    memoryReviews = reviews
    lastFetchedAt = Date.now()
  } catch (err: any) {
    console.error("Failed to write reviews to R2:", err.message)
  }
}

export async function getAllReviews(): Promise<ProductReview[]> {
  const now = Date.now()
  if (memoryReviews && now - lastFetchedAt < CACHE_TTL_MS) {
    return memoryReviews
  }

  if (pendingReviewsPromise) {
    return pendingReviewsPromise
  }

  pendingReviewsPromise = (async () => {
    try {
      const data = await readReviewsFromR2()
      memoryReviews = data
      lastFetchedAt = Date.now()
      return data
    } catch (err) {
      console.error("Failed to fetch reviews:", err)
      return memoryReviews || [...DEFAULT_REVIEWS]
    } finally {
      pendingReviewsPromise = null
    }
  })()

  return pendingReviewsPromise
}

export async function getReviewsForProduct(
  productSlug: string,
  approvedOnly = true
): Promise<ProductReview[]> {
  const all = await getAllReviews()
  const cleanSlug = productSlug.trim().toLowerCase()
  return all
    .filter((r) => {
      const matchesSlug = r.productSlug.toLowerCase() === cleanSlug
      return approvedOnly ? matchesSlug && r.isApproved : matchesSlug
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function computeRatingSummary(reviews: ProductReview[]): ProductRatingSummary {
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  if (reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingCounts,
      recommendPercentage: 100,
    }
  }

  let totalScore = 0
  let positiveCount = 0

  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5
    ratingCounts[star]++
    totalScore += r.rating
    if (r.rating >= 4) {
      positiveCount++
    }
  }

  const averageRating = Number((totalScore / reviews.length).toFixed(1))
  const recommendPercentage = Math.round((positiveCount / reviews.length) * 100)

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingCounts,
    recommendPercentage,
  }
}

export async function getProductRatingSummary(productSlug: string): Promise<ProductRatingSummary> {
  const reviews = await getReviewsForProduct(productSlug, true)
  return computeRatingSummary(reviews)
}

export async function getAllRatingSummaries(): Promise<Record<string, ProductRatingSummary>> {
  const all = await getAllReviews()
  const approved = all.filter((r) => r.isApproved)
  const bySlug: Record<string, ProductReview[]> = {}

  for (const r of approved) {
    const slug = r.productSlug.toLowerCase()
    if (!bySlug[slug]) bySlug[slug] = []
    bySlug[slug].push(r)
  }

  const summaries: Record<string, ProductRatingSummary> = {}
  for (const [slug, reviews] of Object.entries(bySlug)) {
    summaries[slug] = computeRatingSummary(reviews)
  }

  return summaries
}

export async function createProductReview(input: {
  productId: number
  productSlug: string
  productName: string
  authorName: string
  authorLocation?: string
  rating: number
  title: string
  comment: string
  isVerifiedPurchase?: boolean
}): Promise<ProductReview> {
  const all = await getAllReviews()
  const newReview: ProductReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: input.productId,
    productSlug: input.productSlug,
    productName: input.productName,
    authorName: input.authorName.trim(),
    authorLocation: input.authorLocation?.trim() || "Cliente Verificado(a)",
    rating: Math.min(5, Math.max(1, input.rating)),
    title: input.title.trim(),
    comment: input.comment.trim(),
    isVerifiedPurchase: input.isVerifiedPurchase ?? true,
    isApproved: true, // auto-approve so it immediately provides social proof
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
  }

  const updated = [newReview, ...all]
  await writeReviewsToR2(updated)
  invalidateReviewsCache()
  return newReview
}

export async function toggleReviewApproval(id: string): Promise<ProductReview | null> {
  const all = await getAllReviews()
  const index = all.findIndex((r) => r.id === id)
  if (index === -1) return null

  all[index].isApproved = !all[index].isApproved
  await writeReviewsToR2(all)
  invalidateReviewsCache()
  return all[index]
}

export async function deleteReviewById(id: string): Promise<boolean> {
  const all = await getAllReviews()
  const filtered = all.filter((r) => r.id !== id)
  if (filtered.length === all.length) return false

  await writeReviewsToR2(filtered)
  invalidateReviewsCache()
  return true
}

export async function incrementHelpfulVote(id: string): Promise<number> {
  const all = await getAllReviews()
  const index = all.findIndex((r) => r.id === id)
  if (index === -1) return 0

  all[index].helpfulCount = (all[index].helpfulCount || 0) + 1
  await writeReviewsToR2(all)
  invalidateReviewsCache()
  return all[index].helpfulCount
}
