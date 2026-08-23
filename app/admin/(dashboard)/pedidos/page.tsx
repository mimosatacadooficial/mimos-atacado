import Link from "next/link"
import { getAdminOrders } from "@/lib/queries/admin"
import { formatCentsToBRL } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ShoppingCart } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  expirado: "PIX expirado",
  reembolsado: "Reembolsado",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  aguardando_pagamento: "outline",
  pago: "secondary",
  enviado: "secondary",
  entregue: "default",
  cancelado: "destructive",
  expirado: "destructive",
  reembolsado: "outline",
}

export default async function AdminOrdersPage() {
  const orderList = await getAdminOrders()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orderList.length} pedidos registrados.</p>
      </div>

      {orderList.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingCart />
            </EmptyMedia>
            <EmptyTitle>Nenhum pedido ainda</EmptyTitle>
            <EmptyDescription>Os pedidos feitos na loja aparecerão aqui.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderList.map((order) => (
                <TableRow key={order.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-foreground hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.itemCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.shippingCity ? `${order.shippingCity}/${order.shippingState}` : "-"}
                  </TableCell>
                  <TableCell>{formatCentsToBRL(order.totalCents)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                      new Date(order.createdAt),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
