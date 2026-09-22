import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import QRCode from "qrcode"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { PixPaymentPanel } from "@/components/pix-payment-panel"
import { getInMemoryOrder } from "@/lib/orders/memory-store"

export const metadata: Metadata = {
  title: "Pagamento via PIX | Mimos Atacado",
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

  if (!orderData || !orderData.pixCode) redirect("/carrinho")

  if (orderData.status === "pago") {
    redirect(`/pedido-confirmado?numero=${orderData.orderNumber}`)
  }

  const qrDataUrl = await QRCode.toDataURL(orderData.pixCode, { width: 440, margin: 1 })

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-heading text-2xl font-semibold text-balance sm:text-3xl">
        Pague com PIX
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Escaneie o QR Code ou copie o código para concluir seu pedido. Aprovação imediata via SelectusPay.
      </p>
      <PixPaymentPanel
        orderNumber={orderData.orderNumber}
        pixCode={orderData.pixCode}
        qrDataUrl={qrDataUrl}
        totalCents={orderData.totalCents}
        expiresAt={orderData.pixExpiresAt ? orderData.pixExpiresAt.toISOString() : null}
      />
    </div>
  )
}
