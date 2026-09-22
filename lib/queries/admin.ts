import { db } from "@/lib/db"
import { orders, orderItems, products, categories, banners, productCategories } from "@/lib/db/schema"
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm"

export async function getDashboardMetrics() {
  const emptyMetrics = {
    totalRevenueCents: 0,
    totalOrders: 0,
    todayOrders: 0,
    todayRevenueCents: 0,
    pendingOrders: 0,
    productCount: 0,
    lowStockProducts: [],
    recentOrders: [],
    topProducts: [],
  }
  if (!process.env.DATABASE_URL) return emptyMetrics

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

    return {
      totalRevenueCents: Number(revenueRow?.totalRevenue ?? 0),
      totalOrders: Number(revenueRow?.orderCount ?? 0),
      todayOrders: Number(todayRow?.orderCount ?? 0),
      todayRevenueCents: Number(todayRow?.revenue ?? 0),
      pendingOrders: Number(pendingRow?.count ?? 0),
      productCount: Number(productCountRow?.count ?? 0),
      lowStockProducts,
      recentOrders,
      topProducts,
    }
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return emptyMetrics
  }
}

export async function getAdminProducts() {
  if (!process.env.DATABASE_URL) return []
  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePriceCents: products.basePriceCents,
        stock: products.stock,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        categoryName: categories.name,
        images: products.images,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt))

    if (rows.length === 0) return []

    const productIds = rows.map((r) => r.id)
    const links = await db
      .select({
        productId: productCategories.productId,
        categoryName: categories.name,
      })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(inArray(productCategories.productId, productIds))

    return rows.map((row) => {
      const names = links.filter((l) => l.productId === row.id).map((l) => l.categoryName)
      return { ...row, categoryNames: names.length > 0 ? names : [row.categoryName].filter(Boolean) as string[] }
    })
  } catch (error) {
    console.error("Error fetching admin products:", error)
    return []
  }
}

export async function getAdminCategories() {
  if (!process.env.DATABASE_URL) return []
  try {
    return await db.select().from(categories).orderBy(categories.sortOrder)
  } catch (error) {
    console.error("Error fetching admin categories:", error)
    return []
  }
}

export async function getAdminOrders() {
  if (!process.env.DATABASE_URL) return []
  try {
    return await db.select().from(orders).orderBy(desc(orders.createdAt))
  } catch (error) {
    console.error("Error fetching admin orders:", error)
    return []
  }
}

export async function getAdminOrderById(id: number) {
  if (!process.env.DATABASE_URL) return null
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))
    if (!order) return null
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return { order, items }
  } catch (error) {
    console.error("Error fetching admin order by id:", error)
    return null
  }
}

export async function getAdminBanners() {
  if (!process.env.DATABASE_URL) return []
  try {
    return await db.select().from(banners).orderBy(banners.sortOrder)
  } catch (error) {
    console.error("Error fetching admin banners:", error)
    return []
  }
}
