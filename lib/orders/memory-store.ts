export interface CachedOrder {
  id: number
  orderNumber: string
  status: string
  subtotalCents: number
  shippingCents: number
  totalCents: number
  shippingState?: string | null
  shippingCity?: string | null
  itemCount: number
  pixPaymentId?: string | null
  pixCode?: string | null
  pixExpiresAt?: Date | null
  createdAt: Date
}

// Global cache across server modules
const inMemoryOrders = new Map<string, CachedOrder>()

export function saveInMemoryOrder(orderNumber: string, order: CachedOrder) {
  inMemoryOrders.set(orderNumber, order)
}

export function getInMemoryOrder(orderNumber: string): CachedOrder | null {
  return inMemoryOrders.get(orderNumber) || null
}

export function updateInMemoryOrderStatus(orderNumber: string, status: string) {
  const ord = inMemoryOrders.get(orderNumber)
  if (ord) {
    ord.status = status
  }
}
