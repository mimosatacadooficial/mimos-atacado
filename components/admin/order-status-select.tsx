"use client"

import { useTransition } from "react"
import { updateOrderStatus, ORDER_STATUSES } from "@/app/actions/admin-orders"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const STATUS_LABELS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  expirado: "PIX expirado",
  reembolsado: "Reembolsado",
}

export function OrderStatusSelect({ orderId, status }: { orderId: number; status: string }) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      await updateOrderStatus(orderId, value)
      toast.success("Status atualizado.")
    })
  }

  return (
    <Select
      value={status}
      onValueChange={handleChange}
      disabled={isPending}
      items={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
    >
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
