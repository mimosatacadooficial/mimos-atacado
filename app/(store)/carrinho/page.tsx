"use client"

import Link from "next/link"
import { ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CartLineItem } from "@/components/cart-line-item"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { useCart } from "@/lib/cart-context"
import { formatCentsToBRL } from "@/lib/format"

export default function CartPage() {
  const { items, subtotalCents, itemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-16 md:px-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingBag />
            </EmptyMedia>
            <EmptyTitle>Seu carrinho está vazio</EmptyTitle>
            <EmptyDescription>Adicione produtos para começar sua compra no atacado.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/produtos" />} nativeButton={false}>
              Ver produtos
              <ArrowRight data-icon="inline-end" />
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
        Carrinho ({itemCount} {itemCount === 1 ? "item" : "itens"})
      </h1>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4 md:col-span-2 md:p-6">
          {items.map((item) => (
            <CartLineItem key={item.productId} item={item} />
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 md:sticky md:top-24 md:h-fit">
          <h2 className="font-heading text-lg font-semibold text-foreground">Resumo</h2>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCentsToBRL(subtotalCents)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Frete</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Grátis</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-4 font-heading text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatCentsToBRL(subtotalCents)}</span>
          </div>
          <Button size="lg" className="w-full glow-sm" render={<Link href="/checkout" />} nativeButton={false}>
            Finalizar compra
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button variant="ghost" render={<Link href="/produtos" />} nativeButton={false}>
            Continuar comprando
          </Button>
        </div>
      </div>
    </div>
  )
}
