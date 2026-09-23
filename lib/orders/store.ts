import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { db, isDatabaseConfigured } from "@/lib/db"
import { orders, orderItems } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "3ba2d09cbe5f5e41c662f0cfcd389688"
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "8ea963a0b1825e501dccf4de5d90c15b"
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "2870c78f0976edac2cc4f98e016cad1b52d85885385bfe11fe326f8e1ab27d88"
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "mimos-atacado"
const ORDERS_KEY = "data/orders.json"

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

export interface StoredOrderItem {
  id?: number
  productId: number
  productName: string
  quantity: number
  unitPriceCents: number
  totalPriceCents: number
}

export interface StoredOrder {
  id: number
  orderNumber: string
  status: string
  subtotalCents: number
  shippingCents: number
  totalCents: number
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  customerDocument?: string | null
  shippingState?: string | null
  shippingCity?: string | null
  itemCount: number
  items: StoredOrderItem[]
  pixPaymentId?: string | null
  pixCode?: string | null
  pixExpiresAt?: string | null
  utmSource?: string | null
  utmCampaign?: string | null
  utmMedium?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  src?: string | null
  sck?: string | null
  createdAt: string
  updatedAt: string
}

export interface OrdersData {
  version: number
  updatedAt: string
  orders: StoredOrder[]
}

// In-memory cache for ultra-fast response
let memoryOrders: OrdersData | null = null
let lastFetchedAt = 0
const CACHE_TTL_MS = 3000

async function readOrdersFromR2(): Promise<OrdersData> {
  try {
    const cmd = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: ORDERS_KEY,
    })
    const res = await s3Client.send(cmd)
    const jsonStr = await res.Body?.transformToString()
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr) as OrdersData
      if (Array.isArray(parsed.orders)) {
        return parsed
      }
    }
  } catch (err: any) {
    if (err.name !== "NoSuchKey" && err.$metadata?.httpStatusCode !== 404) {
      console.warn("R2 orders read warning:", err.message)
    }
  }

  // Not found in R2: initialize empty
  const initialData: OrdersData = {
    version: 1,
    updatedAt: new Date().toISOString(),
    orders: [],
  }
  return initialData
}

async function writeOrdersToR2(data: OrdersData): Promise<void> {
  try {
    data.updatedAt = new Date().toISOString()
    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: ORDERS_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
      CacheControl: "no-cache",
    })
    await s3Client.send(cmd)
    memoryOrders = data
    lastFetchedAt = Date.now()
  } catch (err: any) {
    console.error("Failed to write orders to R2:", err.message)
  }
}

export async function getAllPersistentOrders(forceRefresh = false): Promise<StoredOrder[]> {
  const now = Date.now()
  if (!forceRefresh && memoryOrders && now - lastFetchedAt < CACHE_TTL_MS) {
    return memoryOrders.orders
  }

  // Check PostgreSQL first if configured
  if (isDatabaseConfigured()) {
    try {
      const dbOrders = await db.select().from(orders).orderBy(desc(orders.createdAt))
      if (dbOrders.length > 0) {
        const orderIds = dbOrders.map((o) => o.id)
        const dbItems =
          orderIds.length > 0
            ? await db.select().from(orderItems)
            : []

        const mapped: StoredOrder[] = dbOrders.map((o) => {
          const items = dbItems
            .filter((i) => i.orderId === o.id)
            .map((i) => ({
              id: i.id,
              productId: i.productId || 0,
              productName: i.productName,
              quantity: i.quantity,
              unitPriceCents: i.unitPriceCents,
              totalPriceCents: i.totalPriceCents,
            }))

          return {
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            subtotalCents: o.subtotalCents,
            shippingCents: o.shippingCents,
            totalCents: o.totalCents,
            shippingState: o.shippingState,
            shippingCity: o.shippingCity,
            itemCount: o.itemCount,
            items,
            pixPaymentId: o.pixPaymentId,
            pixCode: o.pixCode,
            pixExpiresAt: o.pixExpiresAt ? new Date(o.pixExpiresAt).toISOString() : null,
            utmSource: o.utmSource,
            utmCampaign: o.utmCampaign,
            utmMedium: o.utmMedium,
            utmContent: o.utmContent,
            utmTerm: o.utmTerm,
            src: o.src,
            sck: o.sck,
            createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString(),
          }
        })

        const result: OrdersData = {
          version: 1,
          updatedAt: new Date().toISOString(),
          orders: mapped,
        }
        memoryOrders = result
        lastFetchedAt = now
        writeOrdersToR2(result).catch(() => {})
        return mapped
      }
    } catch (dbErr: any) {
      console.warn("Postgres read orders warning:", dbErr.message)
    }
  }

  // Fallback to Cloudflare R2
  const r2Data = await readOrdersFromR2()
  memoryOrders = r2Data
  lastFetchedAt = now
  return r2Data.orders
}

export async function savePersistentOrder(order: StoredOrder): Promise<void> {
  const currentOrders = await getAllPersistentOrders(true)
  const existingIdx = currentOrders.findIndex(
    (o) => o.orderNumber === order.orderNumber || o.id === order.id
  )

  if (existingIdx >= 0) {
    currentOrders[existingIdx] = {
      ...currentOrders[existingIdx],
      ...order,
      updatedAt: new Date().toISOString(),
    }
  } else {
    currentOrders.unshift(order)
  }

  const updatedData: OrdersData = {
    version: 1,
    updatedAt: new Date().toISOString(),
    orders: currentOrders,
  }

  await writeOrdersToR2(updatedData)
}

export async function getPersistentOrderByNumber(orderNumber: string): Promise<StoredOrder | null> {
  const all = await getAllPersistentOrders()
  return all.find((o) => o.orderNumber === orderNumber) || null
}

export async function getPersistentOrderById(id: number): Promise<StoredOrder | null> {
  const all = await getAllPersistentOrders()
  return all.find((o) => o.id === id) || null
}

export async function updatePersistentOrderStatus(
  idOrNumber: number | string,
  newStatus: string
): Promise<boolean> {
  const currentOrders = await getAllPersistentOrders(true)
  const found = currentOrders.find((o) =>
    typeof idOrNumber === "number" ? o.id === idOrNumber : o.orderNumber === idOrNumber
  )

  if (!found) return false

  found.status = newStatus
  found.updatedAt = new Date().toISOString()

  const updatedData: OrdersData = {
    version: 1,
    updatedAt: new Date().toISOString(),
    orders: currentOrders,
  }

  await writeOrdersToR2(updatedData)
  return true
}

export async function updatePersistentOrderByPixId(
  pixPaymentId: string,
  newStatus: string
): Promise<StoredOrder | null> {
  const currentOrders = await getAllPersistentOrders(true)
  const found = currentOrders.find((o) => o.pixPaymentId === pixPaymentId)

  if (!found) return null

  found.status = newStatus
  found.updatedAt = new Date().toISOString()

  const updatedData: OrdersData = {
    version: 1,
    updatedAt: new Date().toISOString(),
    orders: currentOrders,
  }

  await writeOrdersToR2(updatedData)
  return found
}
