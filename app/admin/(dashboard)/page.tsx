import { getDashboardMetrics } from "@/lib/queries/admin"
import { DashboardView } from "@/components/admin/dashboard-view"

export const metadata = {
  title: "Visão Geral | Painel Mimos Atacado",
  description: "Métricas de vendas, pedidos e desempenho do catálogo no atacado.",
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  return <DashboardView initialMetrics={metrics} />
}
