"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { getInMemoryOrder } from "@/lib/orders/memory-store"

const STATUS_MAP: Record<string, string> = {
  pending: "aguardando_pagamento",
  approved: "pago",
  paid: "pago",
  expired: "expirado",
  refunded: "reembolsado",
}

export type PaymentStatusResult =
  | { success: true; status: string }
  | { success: false; error: string }

/**
 * Consulta o status do pagamento do pedido (acionado periodicamente pela tela de pagamento).
 */
export async function checkOrderPaymentStatus(orderNumber: string): Promise<PaymentStatusResult> {
  let order: {
    id?: number
    status: string
    pixPaymentId?: string | null
  } | null = null

  if (process.env.DATABASE_URL) {
    try {
      const [dbOrder] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber))
      if (dbOrder) order = dbOrder
    } catch (err) {
      console.warn("DB query error in checkOrderPaymentStatus:", err)
    }
  }

  if (!order) {
    order = getInMemoryOrder(orderNumber)
  }

  if (!order) {
    return { success: false, error: "Pedido não encontrado." }
  }

  // Se já foi pago ou finalizado, retorna o status diretamente
  if (order.status === "pago" || order.status === "expirado" || order.status === "reembolsado") {
    return { success: true, status: order.status }
  }

  const mappedStatus = STATUS_MAP[order.status] ?? order.status

  if (order.id && mappedStatus !== order.status && process.env.DATABASE_URL) {
    try {
      await db
        .update(orders)
        .set({ status: mappedStatus, updatedAt: new Date() })
        .where(eq(orders.id, order.id))
      revalidatePath("/admin/pedidos")
      revalidatePath(`/admin/pedidos/${order.id}`)
    } catch (dbErr) {
      console.warn("DB update error in checkOrderPaymentStatus:", dbErr)
    }
  }

  return { success: true, status: mappedStatus }
}
