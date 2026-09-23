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

export interface ChartPoint {
  label: string
  fullDate?: string
  revenueCents: number
  ordersCount: number
}

export interface StatusCount {
  status: string
  label: string
  count: number
  percentage: number
  colorClass: string
}

export interface TopProductMetric {
  productName: string
  totalQuantity: number
  totalRevenueCents: number
}

export interface PeriodMetrics {
  revenueCents: number
  ordersCount: number
  pixGeneratedCount: number
  pendingPixCount: number
  pixConversionRate: number
  averageTicketCents: number
  chartData: ChartPoint[]
  statusDistribution: StatusCount[]
  recentOrders: {
    id: number
    orderNumber: string
    status: string
    customerName?: string | null
    shippingCity?: string | null
    shippingState?: string | null
    totalCents: number
    itemCount: number
    createdAt: string
  }[]
  topProducts: TopProductMetric[]
}

export interface DashboardMetrics {
  totalRevenueCents: number
  totalOrders: number
  totalPixGenerated: number
  pendingOrders: number
  pixConversionRate: number
  productCount: number
  lowStockProducts: { id: number; name: string; stock: number }[]
  allOrders: StoredOrder[]
  periods: {
    today: PeriodMetrics
    yesterday: PeriodMetrics
    week: PeriodMetrics
    month: PeriodMetrics
    all: PeriodMetrics
  }
}

export const STATUS_LABELS_MAP: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  expirado: "PIX expirado",
  reembolsado: "Reembolsado",
}

export const STATUS_COLOR_MAP: Record<string, string> = {
  aguardando_pagamento: "bg-amber-500",
  pago: "bg-emerald-500",
  enviado: "bg-blue-500",
  entregue: "bg-primary",
  cancelado: "bg-red-500",
  expirado: "bg-zinc-400",
  reembolsado: "bg-purple-500",
}

export function isPaidOrder(status: string): boolean {
  return status === "pago" || status === "enviado" || status === "entregue"
}

/**
 * Pure calculation function (runs both on server and in client browser).
 */
export function calculatePeriodMetrics(
  orderList: StoredOrder[],
  startDate: Date | string | number | null = null,
  endDate: Date | string | number | null = null,
  grouping: "hours" | "days" | "months" = "days"
): PeriodMetrics {
  const startTs = startDate ? new Date(startDate).getTime() : null
  const endTs = endDate ? new Date(endDate).getTime() : null

  const filtered = (orderList || []).filter((o) => {
    const oTime = new Date(o.createdAt).getTime()
    if (startTs !== null && !isNaN(startTs) && oTime < startTs) return false
    if (endTs !== null && !isNaN(endTs) && oTime > endTs) return false
    return true
  })

  const pixGeneratedCount = filtered.length
  const paidOrders = filtered.filter((o) => isPaidOrder(o.status))
  const pendingPixCount = filtered.filter((o) => o.status === "aguardando_pagamento").length
  const revenueCents = paidOrders.reduce((sum, o) => sum + (o.totalCents || 0), 0)
  const ordersCount = paidOrders.length
  const pixConversionRate =
    pixGeneratedCount > 0 ? Math.round((ordersCount / pixGeneratedCount) * 100) : 0
  const averageTicketCents = ordersCount > 0 ? Math.round(revenueCents / ordersCount) : 0

  // 1. Status Distribution
  const statusCounts: Record<string, number> = {}
  for (const o of filtered) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  }
  const statusDistribution: StatusCount[] = Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      label: STATUS_LABELS_MAP[status] || status,
      count,
      percentage: pixGeneratedCount > 0 ? Math.round((count / pixGeneratedCount) * 100) : 0,
      colorClass: STATUS_COLOR_MAP[status] || "bg-primary",
    }))
    .sort((a, b) => b.count - a.count)

  // 2. Chart points generation based on grouping
  let chartData: ChartPoint[] = []

  if (grouping === "hours") {
    const hours = [0, 4, 8, 12, 16, 20, 23]
    chartData = hours.map((hour, idx) => {
      const nextHour = idx === hours.length - 1 ? 24 : hours[idx + 1]
      const label = `${String(hour).padStart(2, "0")}h`
      const inBucket = paidOrders.filter((o) => {
        const h = new Date(o.createdAt).getHours()
        return h >= hour && h < nextHour
      })
      const bucketRevenue = inBucket.reduce((sum, o) => sum + (o.totalCents || 0), 0)
      return {
        label,
        revenueCents: bucketRevenue,
        ordersCount: inBucket.length,
      }
    })
  } else if (grouping === "days") {
    const refEnd = endDate ? new Date(endDate) : new Date()
    const startObj = startDate ? new Date(startDate) : null
    const daysCount = startObj && !isNaN(startObj.getTime())
      ? Math.max(Math.min(Math.ceil((refEnd.getTime() - startObj.getTime()) / (24 * 3600 * 1000)), 31), 7)
      : 7

    const dayPoints: ChartPoint[] = []
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(refEnd.getTime() - i * 24 * 3600 * 1000)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime()
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime()

      const inBucket = paidOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= dayStart && t <= dayEnd
      })

      const bucketRevenue = inBucket.reduce((sum, o) => sum + (o.totalCents || 0), 0)
      const dayLabel = `${weekDays[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`

      dayPoints.push({
        label: dayLabel,
        fullDate: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
        revenueCents: bucketRevenue,
        ordersCount: inBucket.length,
      })
    }
    chartData = dayPoints
  } else {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    const ref = endDate ? new Date(endDate) : new Date()
    const monthPoints: ChartPoint[] = []

    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(ref.getFullYear(), ref.getMonth() - i, 1)
      const y = mDate.getFullYear()
      const m = mDate.getMonth()
      const startM = new Date(y, m, 1, 0, 0, 0).getTime()
      const endM = new Date(y, m + 1, 0, 23, 59, 59).getTime()

      const inBucket = paidOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= startM && t <= endM
      })

      const bucketRevenue = inBucket.reduce((sum, o) => sum + (o.totalCents || 0), 0)
      monthPoints.push({
        label: `${monthNames[m]}`,
        fullDate: `${monthNames[m]}/${y}`,
        revenueCents: bucketRevenue,
        ordersCount: inBucket.length,
      })
    }
    chartData = monthPoints
  }

  // 3. Top Products
  const prodMap = new Map<string, { totalQuantity: number; totalRevenueCents: number }>()
  for (const o of filtered) {
    if (o.items && Array.isArray(o.items)) {
      for (const it of o.items) {
        const existing = prodMap.get(it.productName) || { totalQuantity: 0, totalRevenueCents: 0 }
        existing.totalQuantity += it.quantity
        existing.totalRevenueCents += it.totalPriceCents
        prodMap.set(it.productName, existing)
      }
    }
  }

  const topProducts: TopProductMetric[] = Array.from(prodMap.entries())
    .map(([productName, data]) => ({
      productName,
      totalQuantity: data.totalQuantity,
      totalRevenueCents: data.totalRevenueCents,
    }))
    .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents)
    .slice(0, 5)

  // 4. Recent Orders
  const recentOrders = [...filtered]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      customerName: o.customerName || null,
      shippingCity: o.shippingCity || null,
      shippingState: o.shippingState || null,
      totalCents: o.totalCents,
      itemCount: o.itemCount,
      createdAt: o.createdAt,
    }))

  return {
    revenueCents,
    ordersCount,
    pixGeneratedCount,
    pendingPixCount,
    pixConversionRate,
    averageTicketCents,
    chartData,
    statusDistribution,
    recentOrders,
    topProducts,
  }
}
