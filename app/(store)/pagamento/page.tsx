import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import QRCode from "qrcode"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { PixPaymentPanel } from "@/components/pix-payment-panel"
import { getInMemoryOrder } from "@/lib/orders/memory-store"
import { getPersistentOrderByNumber } from "@/lib/orders/store"

export const metadata: Metadata = {
  title: "Pagamento via PIX",
  description: "Finalize o pagamento do seu pedido via PIX com aprovação instantânea.",
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const { numero } = await searchParams
  if (!numero) redirect("/carrinho")

  let orderData: {
    orderNumber: string
    pixCode?: string | null
    status: string
    totalCents: number
    pixExpiresAt?: Date | null
  } | null = null

  if (process.env.DATABASE_URL) {
    try {
      const [dbOrder] = await db.select().from(orders).where(eq(orders.orderNumber, numero))
      if (dbOrder) orderData = dbOrder
    } catch (err) {
      console.warn("DB error fetching order on payment page:", err)
    }
  }

  if (!orderData) {
    orderData = getInMemoryOrder(numero)
  }

  if (!orderData) {
    try {
      const r2Order = await getPersistentOrderByNumber(numero)
      if (r2Order) {
        orderData = {
          orderNumber: r2Order.orderNumber,
          pixCode: r2Order.pixCode,
          status: r2Order.status,
          totalCents: r2Order.totalCents,
          pixExpiresAt: r2Order.pixExpiresAt ? new Date(r2Order.pixExpiresAt) : null,
        }
      }
    } catch (err) {
      console.warn("R2 fetch error on payment page:", err)
    }
  }

  if (!orderData || !orderData.pixCode) redirect("/carrinho")

  if (orderData.status === "pago") {
    redirect(`/pedido-confirmado?numero=${orderData.orderNumber}`)
  }

  let qrDataUrl = ""
  try {
    qrDataUrl = await QRCode.toDataURL(orderData.pixCode, { width: 440, margin: 1 })
  } catch (err) {
    console.error("Failed to generate QRCode data URL:", err)
  }

  const expiresAtIso = orderData.pixExpiresAt
    ? orderData.pixExpiresAt instanceof Date
      ? !isNaN(orderData.pixExpiresAt.getTime())
        ? orderData.pixExpiresAt.toISOString()
        : null
      : typeof orderData.pixExpiresAt === "string"
        ? orderData.pixExpiresAt
        : null
    : null

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-heading text-2xl font-semibold text-balance sm:text-3xl">
        Pague com PIX
      </h1>
      <p className="mb-4 sm:mb-6 text-sm text-muted-foreground">
        Escaneie o QR Code ou copie o código Pix abaixo para concluir seu pedido. Aprovação imediata.
      </p>
      <PixPaymentPanel
        orderNumber={orderData.orderNumber}
        pixCode={orderData.pixCode}
        qrDataUrl={qrDataUrl}
        totalCents={orderData.totalCents}
        expiresAt={expiresAtIso}
      />
    </div>
  )
}
