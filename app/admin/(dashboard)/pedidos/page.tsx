import { getAdminOrders } from "@/lib/queries/admin"
import { OrdersView } from "@/components/admin/orders-view"

export const metadata = {
  title: "Gerenciar Pedidos",
  description: "Acompanhe e gerencie todos os pedidos da loja.",
}

export default async function AdminOrdersPage() {
  const orderList = await getAdminOrders()

  return <OrdersView initialOrders={orderList} />
}
