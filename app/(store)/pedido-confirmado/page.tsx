import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Home, PackageCheck, ShoppingBag, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCentsToBRL } from "@/lib/format"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getInMemoryOrder } from "@/lib/orders/memory-store"
import { getPersistentOrderByNumber } from "@/lib/orders/store"

export const metadata: Metadata = {
  title: "Compra Aprovada - Pedido Confirmado",
  description: "Seu pagamento foi confirmado e seu pedido já está em preparação.",
}

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const { numero } = await searchParams

  let orderData: {
    orderNumber: string
    totalCents?: number | null
    itemCount?: number | null
    shippingCity?: string | null
    shippingState?: string | null
  } | null = null

  if (numero) {
    if (process.env.DATABASE_URL) {
      try {
        const [dbOrder] = await db.select().from(orders).where(eq(orders.orderNumber, numero))
        if (dbOrder) orderData = dbOrder
      } catch (err) {
        console.warn("DB error in OrderConfirmedPage:", err)
      }
    }

    if (!orderData) {
      orderData = getInMemoryOrder(numero)
    }

    if (!orderData) {
      try {
        const r2Order = await getPersistentOrderByNumber(numero)
        if (r2Order) orderData = r2Order
      } catch (err) {
        console.warn("R2 error in OrderConfirmedPage:", err)
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-10 sm:py-16 text-center sm:px-6">
      {/* Ícone de Sucesso */}
      <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
        <CheckCircle2 className="size-10" />
      </div>

      {/* Badge de Confirmação */}
      <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        ✓ Pagamento Confirmado via PIX
      </span>

      {/* Título Principal e Subtítulo Solicitados */}
      <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Compra aprovada!
      </h1>
      <p className="mt-1.5 text-base font-medium text-emerald-600 dark:text-emerald-400 sm:text-lg">
        Seu pedido está em preparação
      </p>

      {/* Card de Detalhes do Pedido e Etapas */}
      <div className="mt-6 w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 text-left shadow-sm">
        {numero && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Número do pedido</p>
              <p className="font-mono text-base font-bold text-foreground">{numero}</p>
            </div>
            {orderData?.totalCents && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Total pago</p>
                <p className="text-base font-bold text-primary">{formatCentsToBRL(orderData.totalCents)}</p>
              </div>
            )}
          </div>
        )}

        {/* Linha do Tempo / Status do Pedido */}
        <div className="my-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status do seu pedido
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Etapa 1 */}
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5 shrink-0" />
              <span className="text-[11px] font-semibold leading-tight">Pagamento Aprovado</span>
            </div>

            {/* Etapa 2 */}
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-primary">
              <PackageCheck className="size-5 shrink-0 animate-pulse" />
              <span className="text-[11px] font-bold leading-tight">Em Preparação</span>
            </div>

            {/* Etapa 3 */}
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 p-2.5 text-muted-foreground">
              <Truck className="size-5 shrink-0" />
              <span className="text-[11px] font-medium leading-tight">Envio e Entrega</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Recebemos a confirmação do seu pagamento via PIX. Nosso time já está separando e embalando seus produtos no atacado para envio com todo cuidado e carinho. Guarde o número do seu pedido para acompanhamento.
        </p>
      </div>

      {/* Botões de Ação com 'Voltar para o início' em destaque */}
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          size="lg"
          className="w-full gap-2 text-base font-semibold shadow-md glow-sm active:scale-[0.99]"
        >
          <Home className="size-4" />
          Voltar para o início
        </Button>
        <Button
          variant="outline"
          render={<Link href="/produtos" />}
          nativeButton={false}
          size="lg"
          className="w-full gap-2 text-base font-medium"
        >
          <ShoppingBag className="size-4" />
          Ver mais produtos
        </Button>
      </div>
    </div>
  )
}
