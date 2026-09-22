import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { verifyWebhookSignature } from "@/lib/selectuspay"
import { updateInMemoryOrderStatus } from "@/lib/orders/memory-store"

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

    const event = payload.event
    const transactionId = payload.transaction_id || payload.id
    const status = payload.status

    if (!transactionId) {
      return NextResponse.json({ error: "transaction_id ausente" }, { status: 400 })
    }

    let mappedStatus: string | null = null
    if (event === "payment.approved" || status === "approved" || status === "paid") {
      mappedStatus = "pago"
    } else if (event === "payment.expired" || status === "expired") {
      mappedStatus = "expirado"
    } else if (event === "payment.refunded" || status === "refunded") {
      mappedStatus = "reembolsado"
    }

    if (mappedStatus) {
      // 1. Atualiza no banco de dados se conectado
      if (process.env.DATABASE_URL) {
        try {
          const [updated] = await db
            .update(orders)
            .set({ status: mappedStatus, updatedAt: new Date() })
            .where(eq(orders.pixPaymentId, String(transactionId)))
            .returning({ id: orders.id, orderNumber: orders.orderNumber })

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
