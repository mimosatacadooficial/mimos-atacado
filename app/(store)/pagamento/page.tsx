import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import QRCode from "qrcode"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { PixPaymentPanel } from "@/components/pix-payment-panel"

export const metadata: Metadata = {
  title: "Pagamento via PIX | Mimos Atacado",
  description: "Finalize o pagamento do seu pedido via PIX.",
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const { numero } = await searchParams
  if (!numero) redirect("/carrinho")

  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, numero))
  if (!order || !order.pixCode) redirect("/carrinho")

  if (order.status === "pago") {
    redirect(`/pedido-confirmado?numero=${order.orderNumber}`)
  }

  const qrDataUrl = await QRCode.toDataURL(order.pixCode, { width: 440, margin: 1 })

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-heading text-2xl font-semibold text-balance sm:text-3xl">
        Pague com PIX
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Escaneie o QR Code ou copie o código para concluir seu pedido.
      </p>
      <PixPaymentPanel
        orderNumber={order.orderNumber}
        pixCode={order.pixCode}
        qrDataUrl={qrDataUrl}
        totalCents={order.totalCents}
        expiresAt={order.pixExpiresAt ? order.pixExpiresAt.toISOString() : null}
      />
    </div>
  )
}
