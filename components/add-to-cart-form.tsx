"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { formatCentsToBRL } from "@/lib/format"
import { cn } from "@/lib/utils"

type PriceTier = { minQuantity: number; priceCents: number }

type Props = {
  productId: number
  slug: string
  name: string
  image: string
  basePriceCents: number
  minQuantity: number
  priceTiers: PriceTier[]
}

function getUnitPrice(tiers: PriceTier[], base: number, quantity: number) {
  const eligible = tiers.filter((t) => quantity >= t.minQuantity).sort((a, b) => b.minQuantity - a.minQuantity)
  return eligible[0]?.priceCents ?? base
}

export function AddToCartForm({ productId, slug, name, image, basePriceCents, minQuantity, priceTiers }: Props) {
  const [quantity, setQuantity] = useState(minQuantity)
  const { addItem } = useCart()

  const unitPrice = getUnitPrice(priceTiers, basePriceCents, quantity)
  const total = unitPrice * quantity

  function handleAdd() {
    addItem(
      {
        productId,
        slug,
        name,
        image,
        unitPriceCents: unitPrice,
        minQuantity,
        priceTiers,
        basePriceCents,
      },
      quantity
    )
    toast.success(`${name} adicionado ao carrinho`)
  }

  return (
    <div className="flex flex-col gap-4">
      {priceTiers.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-secondary/40 p-3">
          <p className="text-xs font-medium text-foreground">Preços por quantidade</p>
          <div className="flex flex-col gap-1">
            {priceTiers.map((t) => (
              <div
                key={t.minQuantity}
                className={cn(
                  "flex items-center justify-between text-xs",
                  quantity >= t.minQuantity ? "font-semibold text-primary" : "text-muted-foreground"
                )}
              >
                <span>A partir de {t.minQuantity} unidades</span>
                <span>{formatCentsToBRL(t.priceCents)}/un</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Quantidade</span>
        <div className="flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(minQuantity, q - 1))}
            className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
            disabled={quantity <= minQuantity}
            aria-label="Diminuir quantidade"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-12 text-center text-sm font-medium tabular-nums text-foreground">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
            aria-label="Aumentar quantidade"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">mín. {minQuantity} un</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-heading text-2xl font-semibold text-primary">{formatCentsToBRL(total)}</span>
        <span className="text-xs text-muted-foreground">({formatCentsToBRL(unitPrice)}/un)</span>
      </div>

      <Button size="lg" className="w-full glow-sm" onClick={handleAdd}>
        <ShoppingBag data-icon="inline-start" />
        Adicionar ao carrinho
      </Button>
    </div>
  )
}
