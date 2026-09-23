import { db, isDatabaseConfigured } from "@/lib/db"
import { banners } from "@/lib/db/schema"
import { DEFAULT_BANNERS, DEFAULT_PRODUCTS } from "@/lib/data/mock-data"
import {
  getAdminProducts as getCatalogAdminProducts,
  getAdminCategories as getCatalogAdminCategories,
  getCatalog,
} from "@/lib/catalog"
import {
  getAllPersistentOrders,
  getPersistentOrderById,
  type StoredOrder,
} from "@/lib/orders/store"

export interface AdminOrder {
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
  createdAt: Date
  utmSource?: string | null
  utmCampaign?: string | null
  utmMedium?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  src?: string | null
  sck?: string | null
}

import {
  calculatePeriodMetrics,
  type ChartPoint,
  type StatusCount,
  type TopProductMetric,
  type PeriodMetrics,
  type DashboardMetrics,
} from "@/lib/admin/metrics"

export type {
  ChartPoint,
  StatusCount,
  TopProductMetric,
  PeriodMetrics,
  DashboardMetrics,
}
export { calculatePeriodMetrics }

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [persistentOrders, catalog] = await Promise.all([
    getAllPersistentOrders(),
    getCatalog(),
  ])

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0)
  const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)

  // Periods calculation
  const today = calculatePeriodMetrics(persistentOrders, startOfToday, endOfToday, "hours")
  const yesterday = calculatePeriodMetrics(persistentOrders, startOfYesterday, endOfYesterday, "hours")
  const week = calculatePeriodMetrics(persistentOrders, sevenDaysAgo, now, "days")
  const month = calculatePeriodMetrics(persistentOrders, startOfMonth, now, "days")
  const all = calculatePeriodMetrics(persistentOrders, null, null, "months")

  const totalRevenueCents = all.revenueCents
  const totalOrders = all.ordersCount
  const totalPixGenerated = all.pixGeneratedCount
  const pendingOrders = persistentOrders.filter((o) => o.status === "aguardando_pagamento").length
  const pixConversionRate = all.pixConversionRate

  const lowStockProducts = catalog.products
    .filter((p) => p.stock <= 20)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))

  return {
    totalRevenueCents,
    totalOrders,
    totalPixGenerated,
    pendingOrders,
    pixConversionRate,
    productCount: catalog.products.length,
    lowStockProducts,
    allOrders: persistentOrders,
    periods: {
      today,
      yesterday,
      week,
      month,
      all,
    },
  }
}

export async function getAdminProducts() {
  return getCatalogAdminProducts()
}

export async function getAdminCategories() {
  return getCatalogAdminCategories()
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const persistent = await getAllPersistentOrders()
  return persistent.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    customerName: o.customerName || null,
    customerEmail: o.customerEmail || null,
    customerPhone: o.customerPhone || null,
    customerDocument: o.customerDocument || null,
    shippingState: o.shippingState || null,
    shippingCity: o.shippingCity || null,
    itemCount: o.itemCount,
    createdAt: new Date(o.createdAt),
    utmSource: o.utmSource || null,
    utmCampaign: o.utmCampaign || null,
    utmMedium: o.utmMedium || null,
    utmContent: o.utmContent || null,
    utmTerm: o.utmTerm || null,
    src: o.src || null,
    sck: o.sck || null,
  }))
}

export async function getAdminOrderById(id: number): Promise<{
  order: AdminOrder
  items: StoredOrder["items"]
} | null> {
  const persistent = await getPersistentOrderById(id)
  if (!persistent) return null

  return {
    order: {
      id: persistent.id,
      orderNumber: persistent.orderNumber,
      status: persistent.status,
      subtotalCents: persistent.subtotalCents,
      shippingCents: persistent.shippingCents,
      totalCents: persistent.totalCents,
      customerName: persistent.customerName || null,
      customerEmail: persistent.customerEmail || null,
      customerPhone: persistent.customerPhone || null,
      customerDocument: persistent.customerDocument || null,
      shippingState: persistent.shippingState || null,
      shippingCity: persistent.shippingCity || null,
      itemCount: persistent.itemCount,
      createdAt: new Date(persistent.createdAt),
      utmSource: persistent.utmSource || null,
      utmCampaign: persistent.utmCampaign || null,
      utmMedium: persistent.utmMedium || null,
      utmContent: persistent.utmContent || null,
      utmTerm: persistent.utmTerm || null,
      src: persistent.src || null,
      sck: persistent.sck || null,
    },
    items: persistent.items || [],
  }
}

export async function getAdminBanners() {
  if (!isDatabaseConfigured()) return DEFAULT_BANNERS
  try {
    const rows = await db.select().from(banners).orderBy(banners.sortOrder)
    return rows.length > 0 ? rows : DEFAULT_BANNERS
  } catch (error) {
    console.error("Error fetching admin banners:", error)
    return DEFAULT_BANNERS
  }
}
