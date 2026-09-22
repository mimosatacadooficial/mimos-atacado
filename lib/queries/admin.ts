import { db } from "@/lib/db"
import { orders, orderItems, products, categories, banners, productCategories } from "@/lib/db/schema"
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm"
import { DEFAULT_BANNERS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from "@/lib/data/mock-data"

export const FALLBACK_ORDERS = [
  {
    id: 1,
    orderNumber: "MIM-2026-0038",
    status: "pago",
    subtotalCents: 41000,
    shippingCents: 4000,
    totalCents: 45000,
    shippingState: "SP",
    shippingCity: "São Paulo",
    itemCount: 48,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: 2,
    orderNumber: "MIM-2026-0037",
    status: "aguardando_pagamento",
    subtotalCents: 25000,
    shippingCents: 3000,
    totalCents: 28000,
    shippingState: "RJ",
    shippingCity: "Rio de Janeiro",
    itemCount: 24,
    createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
  {
    id: 3,
    orderNumber: "MIM-2026-0036",
    status: "enviado",
    subtotalCents: 70000,
    shippingCents: 5000,
    totalCents: 75000,
    shippingState: "MG",
    shippingCity: "Belo Horizonte",
    itemCount: 80,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
]

export const FALLBACK_METRICS = {
  totalRevenueCents: 1542000,
  totalOrders: 38,
  todayOrders: 3,
  todayRevenueCents: 125000,
  pendingOrders: 2,
  productCount: DEFAULT_PRODUCTS.length,
  lowStockProducts: DEFAULT_PRODUCTS.filter((p) => p.stock <= 20).slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
  })),
  recentOrders: FALLBACK_ORDERS.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    totalCents: o.totalCents,
    itemCount: o.itemCount,
    createdAt: o.createdAt,
  })),
  topProducts: [
    { productName: "Kit Pincéis Profissional 12 Peças", totalQuantity: 140, totalRevenue: 348600 },
    { productName: "Esponja de Maquiagem Blender", totalQuantity: 220, totalRevenue: 107800 },
    { productName: "Sérum Facial Vitamina C 30ml", totalQuantity: 95, totalRevenue: 189050 },
    { productName: "Base Líquida Matte Alta Cobertura", totalQuantity: 88, totalRevenue: 166320 },
  ],
}

export async function getDashboardMetrics() {
  if (!process.env.DATABASE_URL) return FALLBACK_METRICS

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
    if (totalOrders === 0 && Number(productCountRow?.count ?? 0) === 0) {
      return FALLBACK_METRICS
    }

    return {
      totalRevenueCents: Number(revenueRow?.totalRevenue ?? 0),
      totalOrders,
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
    return FALLBACK_METRICS
  }
}

export async function getAdminProducts() {
  const fallbackList = DEFAULT_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePriceCents: p.basePriceCents,
    stock: p.stock,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    categoryName: p.categoryName,
    images: p.images,
    categoryNames: [p.categoryName],
  }))

  if (!process.env.DATABASE_URL) return fallbackList

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

    if (rows.length === 0) return fallbackList

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
      return { ...row, categoryNames: names.length > 0 ? names : ([row.categoryName].filter(Boolean) as string[]) }
    })
  } catch (error) {
    console.error("Error fetching admin products:", error)
    return fallbackList
  }
}

export async function getAdminCategories() {
  if (!process.env.DATABASE_URL) return DEFAULT_CATEGORIES
  try {
    const rows = await db.select().from(categories).orderBy(categories.sortOrder)
    return rows.length > 0 ? rows : DEFAULT_CATEGORIES
  } catch (error) {
    console.error("Error fetching admin categories:", error)
    return DEFAULT_CATEGORIES
  }
}

export async function getAdminOrders() {
  if (!process.env.DATABASE_URL) return FALLBACK_ORDERS
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
  const fallbackItems = [
    {
      id: 1,
      orderId: id,
      productId: 1,
      productName: "Kit Pincéis Profissional 12 Peças",
      quantity: 10,
      unitPriceCents: 2490,
      totalPriceCents: 24900,
    },
    {
      id: 2,
      orderId: id,
      productId: 2,
      productName: "Esponja de Maquiagem Blender",
      quantity: 20,
      unitPriceCents: 490,
      totalPriceCents: 9800,
    },
  ]

  if (!process.env.DATABASE_URL) {
    return fallbackOrder ? { order: fallbackOrder, items: fallbackItems } : null
  }

  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))
    if (!order) return fallbackOrder ? { order: fallbackOrder, items: fallbackItems } : null
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return { order, items }
  } catch (error) {
    console.error("Error fetching admin order by id:", error)
    return fallbackOrder ? { order: fallbackOrder, items: fallbackItems } : null
  }
}

export async function getAdminBanners() {
  if (!process.env.DATABASE_URL) return DEFAULT_BANNERS
  try {
    const rows = await db.select().from(banners).orderBy(banners.sortOrder)
    return rows.length > 0 ? rows : DEFAULT_BANNERS
  } catch (error) {
    console.error("Error fetching admin banners:", error)
    return DEFAULT_BANNERS
  }
}
