"use server"

import { db, isDatabaseConfigured } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { updatePersistentOrderStatus, savePersistentOrder, getAllPersistentOrders, type StoredOrder } from "@/lib/orders/store"
import { updateInMemoryOrderStatus } from "@/lib/orders/memory-store"

export const ORDER_STATUSES = [
  "aguardando_pagamento",
  "pago",
  "enviado",
  "entregue",
  "cancelado",
  "expirado",
  "reembolsado",
] as const

export async function updateOrderStatus(id: number, status: string) {
  // 1. Atualiza permanentemente no Cloudflare R2
  try {
    await updatePersistentOrderStatus(id, status)
  } catch (err) {
    console.warn("R2 update error in admin-orders:", err)
  }

  // 2. Atualiza no PostgreSQL se configurado
  if (isDatabaseConfigured()) {
    try {
      await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id))
    } catch (dbErr) {
      console.warn("Postgres update error in admin-orders:", dbErr)
    }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/pedidos")
  revalidatePath(`/admin/pedidos/${id}`)
  return { success: true }
}

export async function createTestOrder(status: "pago" | "aguardando_pagamento" = "pago") {
  const existing = await getAllPersistentOrders(true)
  const maxId = existing.reduce((max, o) => (o.id > max ? o.id : max), 1000)
  const nextId = maxId + 1
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const orderNumber = `TEST-${new Date().getFullYear()}${randomSuffix}`

  const testOrder: StoredOrder = {
    id: nextId,
    orderNumber,
    status,
    subtotalCents: 12708, // R$ 127,08
    shippingCents: 0,
    totalCents: 12708,
    customerName: "Cliente Demonstração",
    customerEmail: "teste@mimosatacado.com.br",
    customerPhone: "(11) 99999-8888",
    customerDocument: "000.000.000-00",
    shippingState: "SP",
    shippingCity: "São Paulo",
    itemCount: 2,
    items: [
      {
        productId: 9,
        productName: "Kit de maquiagem 38 itens com acessórios extras - Para Revender",
        quantity: 2,
        unitPriceCents: 6354,
        totalPriceCents: 12708,
      },
    ],
    pixPaymentId: `test_pix_${Date.now()}`,
    pixCode: "00020126580014br.gov.bcb.pix0136testemimosatacado@mimosatacado.com.br5204000053039865406127.085802BR5920Mimos Atacado Ltda6009Sao Paulo62070503***6304E1D3",
    pixExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await savePersistentOrder(testOrder)
  updateInMemoryOrderStatus(orderNumber, status)

  revalidatePath("/admin")
  revalidatePath("/admin/pedidos")
  return { success: true, orderNumber }
}
