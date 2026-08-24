import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders, orderItems } from "@/lib/db/schema"
import { ThankYouContent } from "@/components/thank-you-content"

export const metadata: Metadata = {
  title: "Obrigado pela compra | Mimos Atacado",
  description: "Seu pagamento foi confirmado. Obrigado por comprar na Mimos Atacado!",
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const { numero } = await searchParams
  if (!numero) redirect("/produtos")

  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, numero))
  if (!order) redirect("/produtos")

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))

  return (
    <ThankYouContent
      orderNumber={order.orderNumber}
      totalCents={order.totalCents}
      subtotalCents={order.subtotalCents}
      shippingCents={order.shippingCents}
      items={items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        totalPriceCents: item.totalPriceCents,
      }))}
    />
  )
}
