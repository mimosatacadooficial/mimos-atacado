import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { verifyWebhookSignature } from "@/lib/selectuspay"
import { updateInMemoryOrderStatus } from "@/lib/orders/memory-store"
import {
  updatePersistentOrderByPixId,
  getPersistentOrderByNumber,
  updatePersistentOrderStatus,
} from "@/lib/orders/store"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let payload: any = null

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const signature =
      req.headers.get("x-selectuspay-signature") ||
      req.headers.get("x-trackapi-signature") ||
      req.headers.get("x-signature")

    // Valida a assinatura caso tenha sido enviada
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.warn("SelectusPay webhook signature mismatch.")
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
    }

    const event = String(payload.event || payload.type || payload.data?.event || "").toLowerCase()
    const transactionId =
      payload.transaction_id ||
      payload.id ||
      payload.data?.id ||
      payload.data?.transaction_id
    const rawStatus = String(payload.status || payload.data?.status || "").toLowerCase()
    const orderNumber =
      payload.order_number ||
      payload.orderNumber ||
      payload.external_reference ||
      payload.reference ||
      payload.metadata?.order_number ||
      payload.metadata?.orderNumber ||
      payload.data?.order_number ||
      payload.data?.external_reference

    if (!transactionId && !orderNumber) {
      return NextResponse.json({ error: "Identificador da transação ou pedido ausente" }, { status: 400 })
    }

    let mappedStatus: string | null = null
    if (
      event.includes("approved") ||
      event.includes("paid") ||
      rawStatus === "approved" ||
      rawStatus === "paid" ||
      rawStatus === "pago"
    ) {
      mappedStatus = "pago"
    } else if (event.includes("expired") || rawStatus === "expired" || rawStatus === "expirado") {
      mappedStatus = "expirado"
    } else if (event.includes("refunded") || rawStatus === "refunded" || rawStatus === "reembolsado") {
      mappedStatus = "reembolsado"
    }

    if (mappedStatus) {
      // 1. Atualiza permanentemente no Cloudflare R2
      try {
        let updatedR2 = transactionId ? await updatePersistentOrderByPixId(String(transactionId), mappedStatus) : null
        if (!updatedR2 && orderNumber) {
          const r2Order = await getPersistentOrderByNumber(String(orderNumber))
          if (r2Order?.id) {
            await updatePersistentOrderStatus(r2Order.id, mappedStatus)
            updatedR2 = { ...r2Order, status: mappedStatus }
          }
        }

        if (updatedR2) {
          updateInMemoryOrderStatus(updatedR2.orderNumber, mappedStatus)
          revalidatePath("/admin/pedidos")
          revalidatePath(`/admin/pedidos/${updatedR2.id}`)
          revalidatePath("/admin")
        }
      } catch (r2Err) {
        console.warn("R2 update error in webhook:", r2Err)
      }

      // 2. Atualiza no banco de dados se conectado
      if (process.env.DATABASE_URL) {
        try {
          let updated: { id: number; orderNumber: string } | undefined

          if (transactionId) {
            const [byPix] = await db
              .update(orders)
              .set({ status: mappedStatus, updatedAt: new Date() })
              .where(eq(orders.pixPaymentId, String(transactionId)))
              .returning({ id: orders.id, orderNumber: orders.orderNumber })
            updated = byPix
          }

          if (!updated && orderNumber) {
            const [byNumber] = await db
              .update(orders)
              .set({ status: mappedStatus, updatedAt: new Date() })
              .where(eq(orders.orderNumber, String(orderNumber)))
              .returning({ id: orders.id, orderNumber: orders.orderNumber })
            updated = byNumber
          }

          if (updated) {
            updateInMemoryOrderStatus(updated.orderNumber, mappedStatus)
            revalidatePath("/admin/pedidos")
            revalidatePath(`/admin/pedidos/${updated.id}`)
            revalidatePath("/admin")
          }
        } catch (dbErr) {
          console.warn("DB error updating order from webhook:", dbErr)
        }
      }
    }

    return NextResponse.json({ ok: true, received: true })
  } catch (error) {
    console.error("SelectusPay webhook handler error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
