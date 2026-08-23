import { getDashboardMetrics } from "@/lib/queries/admin"
import { formatCentsToBRL } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { DollarSign, ShoppingCart, Clock, Package, TrendingUp } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  aguardando_pagamento: "outline",
  pago: "secondary",
  enviado: "secondary",
  entregue: "default",
  cancelado: "destructive",
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  const cards = [
    {
      label: "Faturamento total",
      value: formatCentsToBRL(metrics.totalRevenueCents),
      icon: DollarSign,
    },
    {
      label: "Pedidos hoje",
      value: String(metrics.todayOrders),
      icon: TrendingUp,
    },
    {
      label: "Pedidos totais",
      value: String(metrics.totalOrders),
      icon: ShoppingCart,
    },
    {
      label: "Aguardando pagamento",
      value: String(metrics.pendingOrders),
      icon: Clock,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted-foreground">Métricas da sua loja em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{card.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-accent">
                <card.icon className="size-5 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentOrders.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Package />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum pedido ainda</EmptyTitle>
                  <EmptyDescription>Os pedidos feitos na loja aparecerão aqui.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                {metrics.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.itemCount} {order.itemCount === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        {formatCentsToBRL(order.totalCents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {metrics.lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{product.name}</span>
                    <Badge variant="outline">{product.stock} un.</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há vendas registradas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {metrics.topProducts.map((item) => (
                <div key={item.productName} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.productName}</span>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{item.totalQuantity} un.</span>
                    <span className="font-medium text-foreground">
                      {formatCentsToBRL(Number(item.totalRevenue))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
