"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { getPixPaymentStatus } from "@/lib/monsterpay"
import { revalidatePath } from "next/cache"

const STATUS_MAP: Record<string, string> = {
  pending: "aguardando_pagamento",
  paid: "pago",
  expired: "expirado",
  refunded: "reembolsado",
}

export type PaymentStatusResult =
  | { success: true; status: string }
  | { success: false; error: string }

/**
 * Polled from the payment page. Checks MonsterPay for the latest status of
 * the order's PIX charge and syncs it to the order row when it changes.
 */
export async function checkOrderPaymentStatus(orderNumber: string): Promise<PaymentStatusResult> {
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber))

  if (!order) {
    return { success: false, error: "Pedido não encontrado." }
  }

  // Already settled locally - no need to keep hitting the provider.
  if (order.status === "pago" || order.status === "expirado" || order.status === "reembolsado") {
    return { success: true, status: order.status }
  }

  if (!order.pixPaymentId) {
    return { success: false, error: "Este pedido não possui um pagamento PIX associado." }
  }

  const result = await getPixPaymentStatus(order.pixPaymentId)
  if (!result.success) {
    return { success: false, error: result.error }
  }

  const mappedStatus = STATUS_MAP[result.status] ?? order.status

  if (mappedStatus !== order.status) {
    await db
      .update(orders)
      .set({ status: mappedStatus, updatedAt: new Date() })
      .where(eq(orders.id, order.id))
    revalidatePath("/admin/pedidos")
    revalidatePath(`/admin/pedidos/${order.id}`)
  }

  return { success: true, status: mappedStatus }
}
