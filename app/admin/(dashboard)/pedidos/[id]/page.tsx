import { notFound } from "next/navigation"
import { getAdminOrderById } from "@/lib/queries/admin"
import { formatCentsToBRL } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusSelect } from "@/components/admin/order-status-select"

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getAdminOrderById(Number(id))
  if (!data) notFound()

  const { order, items } = data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Pedido {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(
              new Date(order.createdAt),
            )}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Itens do pedido</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} un. x {formatCentsToBRL(item.unitPriceCents)}
                  </p>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {formatCentsToBRL(item.totalPriceCents)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCentsToBRL(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Frete</span>
              <span>{order.shippingCents === 0 ? "Grátis" : formatCentsToBRL(order.shippingCents)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
              <span>Total</span>
              <span>{formatCentsToBRL(order.totalCents)}</span>
            </div>
            <div className="mt-4 flex justify-between text-muted-foreground">
              <span>Cidade/UF</span>
              <span>
                {order.shippingCity ? `${order.shippingCity}/${order.shippingState}` : "Não informado"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
