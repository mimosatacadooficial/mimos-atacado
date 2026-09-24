"use client"

import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import { formatCentsToBRL } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { DashboardMetrics, ChartPoint, PeriodMetrics } from "@/lib/admin/metrics"
import { calculatePeriodMetrics } from "@/lib/admin/metrics"
import { createTestOrder } from "@/app/actions/admin-orders"
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
  Percent,
  QrCode,
  Filter,
  Check,
  RefreshCw,
  Eye,
} from "lucide-react"

export type PeriodKey = "today" | "yesterday" | "week" | "month" | "all" | "custom"

interface DashboardViewProps {
  initialMetrics: DashboardMetrics
}

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  week: "Últimos 7 dias",
  month: "Este mês",
  all: "Todo o período",
  custom: "Personalizado",
}

const STATUS_LABELS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  expirado: "PIX expirado",
  reembolsado: "Reembolsado",
}

const STATUS_BADGE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  aguardando_pagamento: "outline",
  pago: "secondary",
  enviado: "secondary",
  entregue: "default",
  cancelado: "destructive",
  expirado: "destructive",
  reembolsado: "outline",
}

export function DashboardView({ initialMetrics }: DashboardViewProps) {
  const [period, setPeriod] = useState<PeriodKey>("all")
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue")
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null)
  const [isPending, startTransition] = useTransition()

  // Custom date range state (defaults to last 15 days)
  const todayStr = new Date().toISOString().slice(0, 10)
  const fifteenDaysAgoStr = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const [customStartDate, setCustomStartDate] = useState(fifteenDaysAgoStr)
  const [customEndDate, setCustomEndDate] = useState(todayStr)
  const [appliedCustomStart, setAppliedCustomStart] = useState(fifteenDaysAgoStr)
  const [appliedCustomEnd, setAppliedCustomEnd] = useState(todayStr)

  // Compute metrics for active period
  const activeMetrics: PeriodMetrics = useMemo(() => {
    if (period === "custom") {
      const start = new Date(`${appliedCustomStart}T00:00:00`)
      const end = new Date(`${appliedCustomEnd}T23:59:59`)
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 3600 * 1000))
      const grouping = diffDays <= 2 ? "hours" : diffDays <= 45 ? "days" : "months"
      return calculatePeriodMetrics(initialMetrics.allOrders, start, end, grouping)
    }

    if (period === "today") return initialMetrics.periods.today
    if (period === "yesterday") return initialMetrics.periods.yesterday
    if (period === "week") return initialMetrics.periods.week
    if (period === "month") return initialMetrics.periods.month
    return initialMetrics.periods.all
  }, [period, appliedCustomStart, appliedCustomEnd, initialMetrics])

  const chartPoints = activeMetrics.chartData
  const currentRevenue = activeMetrics.revenueCents
  const currentOrders = activeMetrics.ordersCount
  const averageTicket = activeMetrics.averageTicketCents

  // SVG Chart Dimensions & Scale
  const chartHeight = 220
  const chartWidth = 720
  const paddingX = 40
  const paddingY = 30
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingY * 2

  const maxVal = Math.max(
    ...chartPoints.map((p) => (chartMode === "revenue" ? p.revenueCents : p.ordersCount)),
    chartMode === "revenue" ? 10000 : 5
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

  // Metric Cards
  const cards = [
    {
      label: `FATURAMENTO (${PERIOD_LABELS[period].toUpperCase()})`,
      value: formatCentsToBRL(currentRevenue),
      icon: DollarSign,
      subtext: currentOrders > 0 ? `${currentOrders} vendas concluídas` : "Nenhuma venda ainda",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: `PEDIDOS PAGOS (${PERIOD_LABELS[period].toUpperCase()})`,
      value: String(currentOrders),
      icon: ShoppingCart,
      subtext: `Ticket médio: ${formatCentsToBRL(averageTicket)}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: `PIX GERADOS (${PERIOD_LABELS[period].toUpperCase()})`,
      value: String(activeMetrics.pixGeneratedCount),
      icon: QrCode,
      subtext: `Conversão: ${activeMetrics.pixConversionRate}%`,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "AGUARDANDO PAGAMENTO",
      value: String(activeMetrics.pendingPixCount),
      icon: Clock,
      subtext: "Cobranças PIX pendentes",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "PRODUTOS ATIVOS",
      value: String(initialMetrics.productCount),
      icon: Package,
      subtext: "Disponíveis na loja",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      href: "/admin/produtos",
    },
  ]

  function handleApplyCustomDate() {
    if (!customStartDate || !customEndDate) {
      toast.error("Informe a data inicial e final.")
      return
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error("A data inicial não pode ser maior que a data final.")
      return
    }
    setAppliedCustomStart(customStartDate)
    setAppliedCustomEnd(customEndDate)
    setPeriod("custom")
    toast.success(`Filtro aplicado: ${customStartDate} até ${customEndDate}`)
  }

  function handleCreateTestOrder(status: "pago" | "aguardando_pagamento") {
    startTransition(async () => {
      try {
        const res = await createTestOrder(status)
        if (res.success) {
          toast.success(
            status === "pago"
              ? `Pedido teste ${res.orderNumber} PAGO gerado com sucesso!`
              : `Pedido teste ${res.orderNumber} AGUARDANDO PIX gerado!`
          )
        }
      } catch {
        toast.error("Erro ao gerar pedido teste.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header with Title and Period Filter Controls */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
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
            Acompanhe o faturamento, volume de vendas, conversão de PIX e catálogo da Mimos Atacado.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-card p-1 shadow-xs">
          {(["today", "yesterday", "week", "month", "all", "custom"] as PeriodKey[]).map((key) => {
            const isSelected = period === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                }`}
              >
                <Calendar className="size-3.5" />
                {PERIOD_LABELS[key]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Period Date Range Inputs */}
      {period === "custom" && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Data Inicial</label>
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-40 bg-card text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Data Final</label>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-40 bg-card text-xs"
            />
          </div>
          <Button size="sm" onClick={handleApplyCustomDate} className="gap-1.5">
            <Filter className="size-3.5" />
            Filtrar Período
          </Button>
          <span className="text-xs text-muted-foreground self-center">
            Exibindo dados de {appliedCustomStart.split("-").reverse().join("/")} até{" "}
            {appliedCustomEnd.split("-").reverse().join("/")}
          </span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => {
          const content = (
            <Card
              key={c.label}
              className="border-border/60 bg-card/60 backdrop-blur-xs transition-all hover:border-border hover:shadow-xs"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </CardTitle>
                <div className={`rounded-lg p-2 ${c.bgColor}`}>
                  <c.icon className={`size-4 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  {c.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.subtext}</p>
              </CardContent>
            </Card>
          )

          if (c.href) {
            return (
              <Link key={c.label} href={c.href} className="group">
                {content}
              </Link>
            )
          }

          return content
        })}
      </div>

      {/* Sales Evolution Chart */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
        <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle className="font-heading text-lg font-semibold text-foreground">
                Evolução das Vendas
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Desempenho no período:{" "}
              <span className="font-medium text-foreground">
                {period === "custom"
                  ? `${appliedCustomStart.split("-").reverse().join("/")} a ${appliedCustomEnd.split("-").reverse().join("/")}`
                  : PERIOD_LABELS[period]}
              </span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border/70 bg-secondary/40 p-0.5">
              <button
                type="button"
                onClick={() => setChartMode("revenue")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  chartMode === "revenue"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Faturamento (R$)
              </button>
              <button
                type="button"
                onClick={() => setChartMode("orders")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  chartMode === "orders"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Qtd. Pedidos
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Status summary banner */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Sparkles className="size-3.5 text-primary" />
              <span>
                {currentOrders > 0
                  ? `${currentOrders} vendas concluídas com ticket médio de ${formatCentsToBRL(averageTicket)}`
                  : "Loja pronta para operar — Os gráficos são atualizados em tempo real a cada novo PIX pago."}
              </span>
            </div>
            <div className="font-semibold text-primary">
              Total do período: {formatCentsToBRL(currentRevenue)} ({currentOrders} pedidos)
            </div>
          </div>

          {/* Interactive SVG Chart Container */}
          <div className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-secondary/15 p-4">
            {/* Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute z-20 pointer-events-none rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg backdrop-blur-md transition-all animate-in fade-in"
                style={{
                  top: "16px",
                  right: "16px",
                }}
              >
                <p className="font-semibold text-foreground">
                  {hoveredPoint.fullDate || hoveredPoint.label}
                </p>
                <div className="mt-1 flex flex-col gap-0.5">
                  <span className="text-emerald-500 font-medium">
                    Faturamento: {formatCentsToBRL(hoveredPoint.revenueCents)}
                  </span>
                  <span className="text-primary font-medium">
                    Pedidos: {hoveredPoint.ordersCount} un.
                  </span>
                </div>
              </div>
            )}

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 md:h-64 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="mimosChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              {[0, 0.33, 0.66, 1].map((pct, idx) => {
                const y = paddingY + innerHeight * (1 - pct)
                const refVal = maxVal * pct
                const refText =
                  chartMode === "revenue"
                    ? formatCentsToBRL(Math.round(refVal))
                    : String(Math.round(refVal))
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-muted-foreground text-[10px] select-none"
                    >
                      {refText}
                    </text>
                  </g>
                )
              })}

              {/* Area fill */}
              {areaD && <path d={areaD} fill="url(#mimosChartGradient)" />}

              {/* Line path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points */}
              {pointsCoordinates.map(({ x, y, point }, idx) => (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible larger hover target */}
                  <circle cx={x} cy={y} r="14" fill="transparent" />

                  {/* Visible point circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={hoveredPoint?.label === point.label ? "6" : "4"}
                    className="fill-card stroke-primary transition-all duration-150"
                    strokeWidth="2.5"
                  />
                </g>
              ))}
            </svg>

            {/* X-axis labels below the chart */}
            <div className="mt-3 flex justify-between px-6 text-[11px] font-medium text-muted-foreground select-none">
              {chartPoints.map((p, idx) => (
                <span
                  key={idx}
                  className={`text-center ${
                    hoveredPoint?.label === p.label ? "text-primary font-bold" : ""
                  }`}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Columns: Status Distribution & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Distribution Card */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              Status de Pedidos
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição dos {activeMetrics.pixGeneratedCount} pedidos no período:{" "}
              <span className="font-medium text-foreground">{PERIOD_LABELS[period]}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {activeMetrics.statusDistribution.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground">
                Nenhum pedido registrado no período selecionado.
              </p>
            ) : (
              activeMetrics.statusDistribution.map((item) => (
                <div key={item.status} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${item.colorClass}`} />
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{item.count}</span>
                      <span className="text-muted-foreground">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${item.colorClass} transition-all duration-300`}
                      style={{ width: `${Math.max(item.percentage, item.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Management */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              Ações Rápidas & Gestão
            </CardTitle>
            <CardDescription className="text-xs">
              Atalhos para gerenciar sua loja e testar pedidos com facilidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/admin/produtos/novo"
              className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col items-start gap-1 p-3.5 text-left")}
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Plus className="size-4 text-primary" />
                Novo Produto
              </div>
              <span className="text-[11px] text-muted-foreground">
                Cadastrar maquiagem ou kit no catálogo
              </span>
            </Link>

            <Link
              href="/admin/pedidos"
              className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col items-start gap-1 p-3.5 text-left")}
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ShoppingCart className="size-4 text-emerald-500" />
                Ver Todos os Pedidos
              </div>
              <span className="text-[11px] text-muted-foreground">
                Acompanhar envios e PIX gerados
              </span>
            </Link>

            <Link
              href="/admin/banners"
              className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col items-start gap-1 p-3.5 text-left")}
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ImageIcon className="size-4 text-blue-500" />
                Banners da Loja
              </div>
              <span className="text-[11px] text-muted-foreground">
                Personalizar os destaques da vitrine
              </span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col items-start gap-1 p-3.5 text-left")}
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ExternalLink className="size-4 text-primary" />
                Ver Loja Online
              </div>
              <span className="text-[11px] text-muted-foreground">
                Visualizar a loja como cliente
              </span>
            </Link>
          </CardContent>

          {/* Test Order Simulator for Admin */}
          <div className="border-t border-border/60 p-4 bg-secondary/15 flex flex-wrap items-center justify-between gap-3 rounded-b-xl">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <RefreshCw className="size-3 text-primary" />
                Simulador de Pedido PIX
              </span>
              <span className="text-[11px] text-muted-foreground">
                Gere um pedido de teste para visualizar os gráficos e métricas operando.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleCreateTestOrder("aguardando_pagamento")}
                className="text-xs h-8"
              >
                + PIX Pendente
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleCreateTestOrder("pago")}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                + PIX Pago
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders in Period */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              Pedidos Recentes no Período
            </CardTitle>
            <CardDescription className="text-xs">
              Últimos pedidos registrados em:{" "}
              <span className="font-medium text-foreground">{PERIOD_LABELS[period]}</span>
            </CardDescription>
          </div>
          <Link
            href="/admin/pedidos"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs text-primary")}
          >
            Ver todos
            <ArrowUpRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {activeMetrics.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <ShoppingCart className="size-8 stroke-1 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">Nenhum pedido neste período</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alterne o filtro para &quot;Todo o período&quot; ou use o simulador acima para testar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="pb-2 font-medium">Pedido</th>
                    <th className="pb-2 font-medium">Cliente / Local</th>
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                    <th className="pb-2 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {activeMetrics.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-2.5 font-semibold text-foreground">{ord.orderNumber}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {ord.customerName || "Cliente"}
                        {ord.shippingCity ? ` (${ord.shippingCity}/${ord.shippingState})` : ""}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(ord.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant={STATUS_BADGE_VARIANTS[ord.status] || "outline"}
                          className="text-[10px] font-normal"
                        >
                          {STATUS_LABELS[ord.status] || ord.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 font-medium text-foreground text-right">
                        {formatCentsToBRL(ord.totalCents)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/admin/pedidos/${ord.id}`}
                          className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-7 px-2 text-xs")}
                        >
                          <Eye className="size-3.5 mr-1" />
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
