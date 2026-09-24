import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { formatCentsToBRL } from "@/lib/format"
import type { ProductWithTiers } from "@/lib/queries/products"

export function ProductCard({ product }: { product: ProductWithTiers }) {
  const lowestTierPrice =
    product.priceTiers.length > 0
      ? Math.min(...product.priceTiers.map((t) => t.priceCents))
      : product.basePriceCents
  const hasDiscount = product.compareAtPriceCents && product.compareAtPriceCents > product.basePriceCents

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-primary/40 hover:shadow-[0_8px_30px_-8px_var(--glow-color)]"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary/40">
        <Image
          src={product.images[0] || "/placeholder.svg?height=400&width=400&query=beauty product"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        />
        {hasDiscount && (
          <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">Oferta</Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{product.name}</p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <div className="flex items-center text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-[10px]">★</span>
            ))}
          </div>
          <span className="font-semibold text-foreground">4.9</span>
          <span>• Atacado Verificado</span>
        </div>
        <div className="mt-auto flex flex-col gap-0.5 pt-1.5">
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCentsToBRL(product.compareAtPriceCents!)}
            </span>
          )}
          <span className="font-heading text-lg font-semibold text-primary">
            {formatCentsToBRL(product.basePriceCents)}
          </span>
          {lowestTierPrice < product.basePriceCents && (
            <span className="text-xs text-muted-foreground">
              a partir de {formatCentsToBRL(lowestTierPrice)}/un no atacado
            </span>
          )}
          <span className="text-xs text-muted-foreground">Mín. {product.minQuantity} unidades</span>
        </div>
      </div>
    </Link>
  )
}
