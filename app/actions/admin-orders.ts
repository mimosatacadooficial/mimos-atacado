"use server"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export const ORDER_STATUSES = [
  "aguardando_pagamento",
  "pago",
  "enviado",
  "entregue",
  "cancelado",
] as const

export async function updateOrderStatus(id: number, status: string) {
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id))
  revalidatePath("/admin/pedidos")
  revalidatePath(`/admin/pedidos/${id}`)
}
