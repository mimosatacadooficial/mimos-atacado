import { db } from "@/lib/db"
import { orders, orderItems, products, categories, banners, productCategories } from "@/lib/db/schema"
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm"

export async function getDashboardMetrics() {
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
}

export async function getAdminProducts() {
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
}

export async function getAdminCategories() {
  return db.select().from(categories).orderBy(categories.sortOrder)
}

export async function getAdminOrders() {
  return db.select().from(orders).orderBy(desc(orders.createdAt))
}

export async function getAdminOrderById(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) return null
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
  return { order, items }
}

export async function getAdminBanners() {
  return db.select().from(banners).orderBy(banners.sortOrder)
}
