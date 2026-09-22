"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { formatCentsToBRL } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import type { AdminOrder } from "@/lib/queries/admin"
import { ShoppingCart, Search, Filter, ArrowUpDown } from "lucide-react"

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

interface OrdersViewProps {
  initialOrders: AdminOrder[]
}

export function OrdersView({ initialOrders }: OrdersViewProps) {
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("todos")

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      const matchesSearch =
        search === "" ||
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        (order.shippingCity && order.shippingCity.toLowerCase().includes(search.toLowerCase())) ||
        (order.shippingState && order.shippingState.toLowerCase().includes(search.toLowerCase()))

      const matchesStatus =
        selectedStatus === "todos" || order.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [initialOrders, search, selectedStatus])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {initialOrders.length === 0
              ? "Nenhum pedido recebido ainda. Sua loja está aguardando as primeiras vendas."
              : `${initialOrders.length} ${initialOrders.length === 1 ? "pedido registrado" : "pedidos registrados"}.`}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
        {[
          { key: "todos", label: "Todos" },
          { key: "aguardando_pagamento", label: "Aguardando pagamento" },
          { key: "pago", label: "Pagos" },
          { key: "enviado", label: "Enviados" },
          { key: "entregue", label: "Entregues" },
          { key: "cancelado", label: "Cancelados" },
        ].map((tab) => {
          const isActive = selectedStatus === tab.key
          const count =
            tab.key === "todos"
              ? initialOrders.length
              : initialOrders.filter((o) => o.status === tab.key).length

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Table or Empty State */}
      {filteredOrders.length === 0 ? (
        <Empty className="py-12 border border-border/70 rounded-2xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
              <ShoppingCart className="size-8" />
            </EmptyMedia>
            <EmptyTitle>
              {search || selectedStatus !== "todos"
                ? "Nenhum pedido encontrado para o filtro selecionado"
                : "Nenhum pedido ainda"}
            </EmptyTitle>
            <EmptyDescription>
              {search || selectedStatus !== "todos"
                ? "Tente remover a busca ou selecionar outro status."
                : "Os pedidos feitos pelos clientes na loja aparecerão aqui em tempo real com todas as informações de envio e pagamento PIX."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
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
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.itemCount} un.</TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.shippingCity ? `${order.shippingCity}/${order.shippingState}` : "-"}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {formatCentsToBRL(order.totalCents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
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
