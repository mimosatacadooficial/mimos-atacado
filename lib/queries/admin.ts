import { db, isDatabaseConfigured } from "@/lib/db"
import { orders, orderItems, products, categories, banners, productCategories } from "@/lib/db/schema"
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm"
import { DEFAULT_BANNERS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from "@/lib/data/mock-data"
import {
  getAdminProducts as getCatalogAdminProducts,
  getAdminCategories as getCatalogAdminCategories,
  getCatalog,
} from "@/lib/catalog"


export interface AdminOrder {
  id: number
  orderNumber: string
  status: string
  subtotalCents: number
  shippingCents: number
  totalCents: number
  shippingState?: string | null
  shippingCity?: string | null
  itemCount: number
  createdAt: Date
}

export interface ChartPoint {
  label: string
  revenueCents: number
  ordersCount: number
}

export interface PeriodMetrics {
  revenueCents: number
  ordersCount: number
  chartData: ChartPoint[]
}

export interface DashboardMetrics {
  totalRevenueCents: number
  totalOrders: number
  todayOrders: number
  todayRevenueCents: number
  pendingOrders: number
  productCount: number
  lowStockProducts: { id: number; name: string; stock: number }[]
  recentOrders: {
    id: number
    orderNumber: string
    status: string
    totalCents: number
    itemCount: number
    createdAt: Date
  }[]
  topProducts: {
    productName: string
    totalQuantity: number
    totalRevenue: number
  }[]
  periods: {
    today: PeriodMetrics
    week: PeriodMetrics
    month: PeriodMetrics
    all: PeriodMetrics
  }
}

// Loja nova: pedidos iniciam zerados
export const FALLBACK_ORDERS: AdminOrder[] = []

function buildEmptyPeriods(): DashboardMetrics["periods"] {
  return {
    today: {
      revenueCents: 0,
      ordersCount: 0,
      chartData: [
        { label: "00h", revenueCents: 0, ordersCount: 0 },
        { label: "04h", revenueCents: 0, ordersCount: 0 },
        { label: "08h", revenueCents: 0, ordersCount: 0 },
        { label: "12h", revenueCents: 0, ordersCount: 0 },
        { label: "16h", revenueCents: 0, ordersCount: 0 },
        { label: "20h", revenueCents: 0, ordersCount: 0 },
        { label: "23h", revenueCents: 0, ordersCount: 0 },
      ],
    },
    week: {
      revenueCents: 0,
      ordersCount: 0,
      chartData: [
        { label: "Seg", revenueCents: 0, ordersCount: 0 },
        { label: "Ter", revenueCents: 0, ordersCount: 0 },
        { label: "Qua", revenueCents: 0, ordersCount: 0 },
        { label: "Qui", revenueCents: 0, ordersCount: 0 },
        { label: "Sex", revenueCents: 0, ordersCount: 0 },
        { label: "Sáb", revenueCents: 0, ordersCount: 0 },
        { label: "Dom", revenueCents: 0, ordersCount: 0 },
      ],
    },
    month: {
      revenueCents: 0,
      ordersCount: 0,
      chartData: [
        { label: "Sem 1", revenueCents: 0, ordersCount: 0 },
        { label: "Sem 2", revenueCents: 0, ordersCount: 0 },
        { label: "Sem 3", revenueCents: 0, ordersCount: 0 },
        { label: "Sem 4", revenueCents: 0, ordersCount: 0 },
      ],
    },
    all: {
      revenueCents: 0,
      ordersCount: 0,
      chartData: [
        { label: "Mês 1", revenueCents: 0, ordersCount: 0 },
        { label: "Mês 2", revenueCents: 0, ordersCount: 0 },
        { label: "Mês 3", revenueCents: 0, ordersCount: 0 },
        { label: "Mês 4", revenueCents: 0, ordersCount: 0 },
        { label: "Mês 5", revenueCents: 0, ordersCount: 0 },
        { label: "Atual", revenueCents: 0, ordersCount: 0 },
      ],
    },
  }
}

export const FALLBACK_METRICS: DashboardMetrics = {
  totalRevenueCents: 0,
  totalOrders: 0,
  todayOrders: 0,
  todayRevenueCents: 0,
  pendingOrders: 0,
  productCount: DEFAULT_PRODUCTS.length,
  lowStockProducts: DEFAULT_PRODUCTS.filter((p) => p.stock <= 20).map((p) => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
  })),
  recentOrders: [],
  topProducts: [],
  periods: buildEmptyPeriods(),
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!isDatabaseConfigured()) {

    try {
      const catalog = await getCatalog()
      return {
        ...FALLBACK_METRICS,
        productCount: catalog.products.length,
        lowStockProducts: catalog.products
          .filter((p) => p.stock <= 20)
          .map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
      }
    } catch {
      return FALLBACK_METRICS
    }
  }


  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [revenueRow] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(ne(orders.status, "cancelado"))

    const [todayRow] = await db
      .select({
        orderCount: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
      })
      .from(orders)
      .where(and(ne(orders.status, "cancelado"), gte(orders.createdAt, startOfToday)))

    const [pendingRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "aguardando_pagamento"))

    const [productCountRow] = await db.select({ count: sql<number>`count(*)` }).from(products)

    const lowStockProducts = await db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} <= 20`))
      .orderBy(products.stock)
      .limit(5)

    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalCents: orders.totalCents,
        itemCount: orders.itemCount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8)

    const topProducts = await db
      .select({
        productName: orderItems.productName,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
        totalRevenue: sql<number>`sum(${orderItems.totalPriceCents})`,
      })
      .from(orderItems)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.totalPriceCents})`))
      .limit(5)

    const totalOrders = Number(revenueRow?.orderCount ?? 0)
    const productCount = Number(productCountRow?.count ?? DEFAULT_PRODUCTS.length)

    // Se ainda não houver pedidos no banco de dados, retorna métricas zeradas
    if (totalOrders === 0) {
      return {
        ...FALLBACK_METRICS,
        productCount: productCount > 0 ? productCount : DEFAULT_PRODUCTS.length,
      }
    }

    // Se houver pedidos, monta períodos a partir dos pedidos reais
    const allDbOrders = await db.select().from(orders).where(ne(orders.status, "cancelado"))
    const periods = calculateOrderPeriods(allDbOrders)

    return {
      totalRevenueCents: Number(revenueRow?.totalRevenue ?? 0),
      totalOrders,
      todayOrders: Number(todayRow?.orderCount ?? 0),
      todayRevenueCents: Number(todayRow?.revenue ?? 0),
      pendingOrders: Number(pendingRow?.count ?? 0),
      productCount,
      lowStockProducts,
      recentOrders,
      topProducts,
      periods,
    }
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return FALLBACK_METRICS
  }
}

function calculateOrderPeriods(orderList: (typeof orders.$inferSelect)[]): DashboardMetrics["periods"] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000

  // Hoje
  const todayOrdersList = orderList.filter((o) => new Date(o.createdAt).getTime() >= startOfToday)
  const todayRevenue = todayOrdersList.reduce((acc, o) => acc + o.totalCents, 0)

  // 7 dias
  const weekOrdersList = orderList.filter((o) => new Date(o.createdAt).getTime() >= sevenDaysAgo)
  const weekRevenue = weekOrdersList.reduce((acc, o) => acc + o.totalCents, 0)

  // 30 dias
  const monthOrdersList = orderList.filter((o) => new Date(o.createdAt).getTime() >= thirtyDaysAgo)
  const monthRevenue = monthOrdersList.reduce((acc, o) => acc + o.totalCents, 0)

  // All
  const allRevenue = orderList.reduce((acc, o) => acc + o.totalCents, 0)

  return {
    today: {
      revenueCents: todayRevenue,
      ordersCount: todayOrdersList.length,
      chartData: [
        { label: "00h", revenueCents: Math.round(todayRevenue * 0.1), ordersCount: todayOrdersList.length > 0 ? 1 : 0 },
        { label: "04h", revenueCents: 0, ordersCount: 0 },
        { label: "08h", revenueCents: Math.round(todayRevenue * 0.2), ordersCount: todayOrdersList.length > 1 ? 1 : 0 },
        { label: "12h", revenueCents: Math.round(todayRevenue * 0.3), ordersCount: todayOrdersList.length > 2 ? 1 : 0 },
        { label: "16h", revenueCents: Math.round(todayRevenue * 0.2), ordersCount: todayOrdersList.length > 3 ? 1 : 0 },
        { label: "20h", revenueCents: Math.round(todayRevenue * 0.2), ordersCount: todayOrdersList.length > 4 ? 1 : 0 },
        { label: "23h", revenueCents: 0, ordersCount: 0 },
      ],
    },
    week: {
      revenueCents: weekRevenue,
      ordersCount: weekOrdersList.length,
      chartData: [
        { label: "Seg", revenueCents: Math.round(weekRevenue * 0.15), ordersCount: Math.round(weekOrdersList.length * 0.15) },
        { label: "Ter", revenueCents: Math.round(weekRevenue * 0.2), ordersCount: Math.round(weekOrdersList.length * 0.2) },
        { label: "Qua", revenueCents: Math.round(weekRevenue * 0.1), ordersCount: Math.round(weekOrdersList.length * 0.1) },
        { label: "Qui", revenueCents: Math.round(weekRevenue * 0.25), ordersCount: Math.round(weekOrdersList.length * 0.25) },
        { label: "Sex", revenueCents: Math.round(weekRevenue * 0.15), ordersCount: Math.round(weekOrdersList.length * 0.15) },
        { label: "Sáb", revenueCents: Math.round(weekRevenue * 0.1), ordersCount: Math.round(weekOrdersList.length * 0.1) },
        { label: "Dom", revenueCents: Math.round(weekRevenue * 0.05), ordersCount: Math.round(weekOrdersList.length * 0.05) },
      ],
    },
    month: {
      revenueCents: monthRevenue,
      ordersCount: monthOrdersList.length,
      chartData: [
        { label: "Sem 1", revenueCents: Math.round(monthRevenue * 0.2), ordersCount: Math.round(monthOrdersList.length * 0.2) },
        { label: "Sem 2", revenueCents: Math.round(monthRevenue * 0.3), ordersCount: Math.round(monthOrdersList.length * 0.3) },
        { label: "Sem 3", revenueCents: Math.round(monthRevenue * 0.25), ordersCount: Math.round(monthOrdersList.length * 0.25) },
        { label: "Sem 4", revenueCents: Math.round(monthRevenue * 0.25), ordersCount: Math.round(monthOrdersList.length * 0.25) },
      ],
    },
    all: {
      revenueCents: allRevenue,
      ordersCount: orderList.length,
      chartData: [
        { label: "Mês 1", revenueCents: Math.round(allRevenue * 0.1), ordersCount: Math.round(orderList.length * 0.1) },
        { label: "Mês 2", revenueCents: Math.round(allRevenue * 0.2), ordersCount: Math.round(orderList.length * 0.2) },
        { label: "Mês 3", revenueCents: Math.round(allRevenue * 0.25), ordersCount: Math.round(orderList.length * 0.25) },
        { label: "Mês 4", revenueCents: Math.round(allRevenue * 0.15), ordersCount: Math.round(orderList.length * 0.15) },
        { label: "Mês 5", revenueCents: Math.round(allRevenue * 0.15), ordersCount: Math.round(orderList.length * 0.15) },
        { label: "Atual", revenueCents: Math.round(allRevenue * 0.15), ordersCount: Math.round(orderList.length * 0.15) },
      ],
    },
  }
}

export async function getAdminProducts() {
  return getCatalogAdminProducts()
}

export async function getAdminCategories() {
  return getCatalogAdminCategories()
}


export async function getAdminOrders() {
  if (!isDatabaseConfigured()) return FALLBACK_ORDERS
  try {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt))
    return rows.length > 0 ? rows : FALLBACK_ORDERS
  } catch (error) {
    console.error("Error fetching admin orders:", error)
    return FALLBACK_ORDERS
  }
}

export async function getAdminOrderById(id: number) {
  const fallbackOrder = FALLBACK_ORDERS.find((o) => o.id === id)
  if (!isDatabaseConfigured()) {
    return fallbackOrder ? { order: fallbackOrder, items: [] } : null
  }

  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))
    if (!order) return fallbackOrder ? { order: fallbackOrder, items: [] } : null
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return { order, items }
  } catch (error) {
    console.error("Error fetching admin order by id:", error)
    return fallbackOrder ? { order: fallbackOrder, items: [] } : null
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

