import { getAdminOrders } from "@/lib/queries/admin"
import { OrdersView } from "@/components/admin/orders-view"

export const metadata = {
  title: "Pedidos | Painel Mimos Atacado",
  description: "Acompanhe e gerencie todos os pedidos da loja.",
}

export default async function AdminOrdersPage() {
  const orderList = await getAdminOrders()

  return <OrdersView initialOrders={orderList} />
}
