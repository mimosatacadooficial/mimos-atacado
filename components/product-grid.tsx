import { ProductCard } from "@/components/product-card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { PackageSearch } from "lucide-react"
import type { ProductWithTiers } from "@/lib/queries/products"

export function ProductGrid({ products }: { products: ProductWithTiers[] }) {
  if (products.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageSearch />
          </EmptyMedia>
          <EmptyTitle>Nenhum produto encontrado</EmptyTitle>
          <EmptyDescription>Tente buscar por outro termo ou explore nossas categorias.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
