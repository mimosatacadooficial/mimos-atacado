"use client"

import { useState } from "react"
import Link from "next/link"
import { formatCentsToBRL } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import type { DashboardMetrics, ChartPoint } from "@/lib/queries/admin"
import {
  DollarSign,
  ShoppingCart,
  Clock,
  Package,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"

type PeriodKey = "today" | "week" | "month" | "all"

interface DashboardViewProps {
  initialMetrics: DashboardMetrics
}

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Hoje",
  week: "Últimos 7 dias",
  month: "Este mês",
  all: "Todo o período",
}

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

export function DashboardView({ initialMetrics }: DashboardViewProps) {
  const [period, setPeriod] = useState<PeriodKey>("all")
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue")
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null)

  const activePeriodMetrics = initialMetrics.periods[period]
  const currentRevenue =
    period === "all" ? initialMetrics.totalRevenueCents : activePeriodMetrics.revenueCents
  const currentOrders =
    period === "all" ? initialMetrics.totalOrders : activePeriodMetrics.ordersCount
  const averageTicket =
    currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0

  const chartPoints = activePeriodMetrics.chartData

  // SVG Chart Dimensions & Scale
  const chartHeight = 220
  const chartWidth = 700
  const paddingX = 40
  const paddingY = 30
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingY * 2

  const maxVal = Math.max(
    ...chartPoints.map((p) => (chartMode === "revenue" ? p.revenueCents : p.ordersCount)),
    chartMode === "revenue" ? 10000 : 5 // fallback baseline scale
  )

  const pointsCoordinates = chartPoints.map((p, i) => {
    const x = paddingX + (i / Math.max(chartPoints.length - 1, 1)) * innerWidth
    const val = chartMode === "revenue" ? p.revenueCents : p.ordersCount
    const y = paddingY + innerHeight - (val / maxVal) * innerHeight
    return { x, y, point: p }
  })

  const pathD = pointsCoordinates.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`
    return `${acc} L ${curr.x} ${curr.y}`
  }, "")

  const areaD =
    pointsCoordinates.length > 0
      ? `${pathD} L ${pointsCoordinates[pointsCoordinates.length - 1].x} ${
          paddingY + innerHeight
        } L ${pointsCoordinates[0].x} ${paddingY + innerHeight} Z`
      : ""

  const cards = [
    {
      label: `Faturamento (${PERIOD_LABELS[period].toLowerCase()})`,
      value: formatCentsToBRL(currentRevenue),
      icon: DollarSign,
      subtext: currentOrders > 0 ? `${currentOrders} vendas no período` : "Nenhuma venda ainda",
      color: "text-emerald-500",
    },
    {
      label: `Pedidos (${PERIOD_LABELS[period].toLowerCase()})`,
      value: String(currentOrders),
      icon: ShoppingCart,
      subtext: `Ticket médio: ${formatCentsToBRL(averageTicket)}`,
      color: "text-primary",
    },
    {
      label: "Aguardando pagamento",
      value: String(initialMetrics.pendingOrders),
      icon: Clock,
      subtext: "Cobranças PIX pendentes",
      color: "text-amber-500",
    },
    {
      label: "Produtos ativos",
      value: String(initialMetrics.productCount),
      icon: Package,
      subtext: "Disponíveis na loja",
      color: "text-blue-500",
      href: "/admin/produtos",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Title and Period Filter Controls */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Visão geral
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-xs font-normal text-primary">
              <Sparkles className="size-3" />
              Loja Oficial
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o faturamento, volume de vendas e desempenho do catálogo da Mimos Atacado.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-card p-1 shadow-xs">
          {(["today", "week", "month", "all"] as PeriodKey[]).map((key) => {
            const isSelected = period === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Calendar className="size-3" />
                {PERIOD_LABELS[key]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Content = (
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
                <span className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {card.value}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {card.subtext}
                </span>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/80 border border-border/50">
                <card.icon className={`size-5 ${card.color}`} />
              </div>
            </CardContent>
          )

          return card.href ? (
            <Link key={card.label} href={card.href} className="group">
              <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
                {Content}
              </Card>
            </Link>
          ) : (
            <Card key={card.label} className="border-border/70 shadow-2xs">
              {Content}
            </Card>
          )
        })}
      </div>

      {/* Chart Section */}
      <Card className="border-border/70 shadow-2xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="size-5 text-primary" />
              Evolução das Vendas
            </CardTitle>
            <CardDescription className="text-xs">
              Desempenho no período: <span className="font-medium text-foreground">{PERIOD_LABELS[period]}</span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setChartMode("revenue")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === "revenue"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Faturamento (R$)
            </button>
            <button
              type="button"
              onClick={() => setChartMode("orders")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === "orders"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Qtd. Pedidos
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Active Hover / Info Banner */}
          <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2 border border-border/40 text-xs">
            {hoveredPoint ? (
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{hoveredPoint.label}:</span>
                <span className="text-primary font-bold">
                  {formatCentsToBRL(hoveredPoint.revenueCents)}
                </span>
                <span className="text-muted-foreground">
                  ({hoveredPoint.ordersCount} {hoveredPoint.ordersCount === 1 ? "pedido" : "pedidos"})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                <span>
                  {currentOrders === 0
                    ? "Loja pronta para operar — Os gráficos serão atualizados em tempo real conforme as vendas forem concluídas."
                    : "Passe o cursor sobre os pontos para visualizar detalhes de cada intervalo."}
                </span>
              </div>
            )}

            <span className="text-[11px] text-muted-foreground">
              Total do período: <strong className="text-foreground">{formatCentsToBRL(currentRevenue)}</strong>
            </span>
          </div>

          {/* SVG Responsive Chart */}
          <div className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-card/50 p-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 md:h-64 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary, #ec4899)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--color-primary, #ec4899)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + innerHeight * (1 - ratio)
                return (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-border/40"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Area Gradient */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Curve Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--color-primary, #ec4899)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {pointsCoordinates.map(({ x, y, point }, idx) => (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r={hoveredPoint === point ? 6 : 4}
                    fill="var(--color-card, #ffffff)"
                    stroke="var(--color-primary, #ec4899)"
                    strokeWidth="2.5"
                    className="transition-all duration-150"
                  />
                  {/* Invisible larger hover target */}
                  <circle
                    cx={x}
                    cy={y}
                    r="16"
                    fill="transparent"
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Label on X Axis */}
                  <text
                    x={x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    className="text-[10px] fill-muted-foreground select-none"
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Middle Row: Status breakdown & Quick store actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status Breakdown */}
        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Status de Pedidos</CardTitle>
            <CardDescription className="text-xs">Distribuição atual dos pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {[
                { label: "Aguardando pagamento", count: initialMetrics.pendingOrders, color: "bg-amber-500" },
                { label: "Pago", count: 0, color: "bg-emerald-500" },
                { label: "Enviado", count: 0, color: "bg-blue-500" },
                { label: "Entregue", count: 0, color: "bg-primary" },
                { label: "Cancelado", count: 0, color: "bg-red-500" },
              ].map((st) => (
                <div key={st.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${st.color}`} />
                    <span className="text-muted-foreground">{st.label}</span>
                  </div>
                  <span className="font-semibold text-foreground">{st.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-secondary/50 p-3 text-center text-xs text-muted-foreground">
              {currentOrders === 0
                ? "Nenhuma movimentação registrada no momento."
                : `${currentOrders} pedidos processados no período.`}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Store Health */}
        <Card className="lg:col-span-2 border-border/70 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Ações Rápidas & Gestão</CardTitle>
            <CardDescription className="text-xs">Atalhos para gerenciar sua loja com facilidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/admin/produtos/novo"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/80 bg-card p-4 text-center transition-all hover:border-primary/50 hover:bg-secondary/40"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Plus className="size-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">Novo Produto</span>
                  <span className="text-[11px] text-muted-foreground">Adicionar item ao catálogo</span>
                </div>
              </Link>

              <Link
                href="/admin/banners"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/80 bg-card p-4 text-center transition-all hover:border-primary/50 hover:bg-secondary/40"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ImageIcon className="size-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">Banners</span>
                  <span className="text-[11px] text-muted-foreground">Personalizar banners da home</span>
                </div>
              </Link>

              <Link
                href="/"
                target="_blank"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/80 bg-card p-4 text-center transition-all hover:border-primary/50 hover:bg-secondary/40"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ExternalLink className="size-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">Ver Loja Online</span>
                  <span className="text-[11px] text-muted-foreground">Acessar a vitrine ao vivo</span>
                </div>
              </Link>
            </div>

            {/* Checklist de Lançamento */}
            <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Status do E-commerce
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {initialMetrics.productCount} produtos ativos no atacado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Banners promocionais ativos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Pagamento PIX automático MonsterPay
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Catálogo com preços escalonados
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Orders and Low Stock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders Table / Empty State */}
        <Card className="lg:col-span-2 border-border/70 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Pedidos Recentes</CardTitle>
              <CardDescription className="text-xs">Últimos pedidos registrados na loja</CardDescription>
            </div>
            <Link
              href="/admin/pedidos"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              Ver todos
              <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {initialMetrics.recentOrders.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
                    <ShoppingCart className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum pedido ainda</EmptyTitle>
                  <EmptyDescription>
                    Sua loja está aberta para receber compras. Quando os clientes finalizarem pedidos via PIX, eles aparecerão aqui em tempo real.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-2.5">
                {initialMetrics.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 transition-colors hover:bg-secondary/30"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.itemCount} {order.itemCount === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCentsToBRL(order.totalCents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Alerta de Estoque</CardTitle>
            <CardDescription className="text-xs">Produtos com necessidade de reposição</CardDescription>
          </CardHeader>
          <CardContent>
            {initialMetrics.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="size-8 text-emerald-500/80 mb-2" />
                <p className="font-medium text-foreground">Estoque em dia!</p>
                <p className="mt-1 text-[11px]">Todos os produtos cadastrados possuem estoque suficiente.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {initialMetrics.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-xs"
                  >
                    <span className="font-medium text-foreground truncate max-w-[180px]">
                      {product.name}
                    </span>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-500 font-semibold">
                      {product.stock} un.
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
