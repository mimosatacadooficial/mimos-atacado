"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, X } from "lucide-react"
import { useCart, type CartItem } from "@/lib/cart-context"
import { formatCentsToBRL } from "@/lib/format"

export function CartLineItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="flex gap-4 border-b border-border/60 py-4 last:border-b-0">
      <Link href={`/produto/${item.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" sizes="80px" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/produto/${item.slug}`} className="text-sm font-medium leading-snug text-foreground hover:text-primary">
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`Remover ${item.name}`}
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{formatCentsToBRL(item.unitPriceCents)}/un</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, Math.max(item.minQuantity, item.quantity - 1))}
              className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
              disabled={item.quantity <= item.minQuantity}
              aria-label="Diminuir quantidade"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-9 text-center text-xs font-medium tabular-nums text-foreground">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
              aria-label="Aumentar quantidade"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <span className="font-heading text-sm font-semibold text-foreground">
            {formatCentsToBRL(item.unitPriceCents * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  )
}
