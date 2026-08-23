import type { Metadata } from "next"
import { ProductGrid } from "@/components/product-grid"
import { getAllActiveProducts } from "@/lib/queries/products"

export const metadata: Metadata = {
  title: "Todos os produtos | Mimos Atacado",
  description: "Explore todo o catálogo de maquiagem, skincare e beleza no atacado para revenda.",
}

export default async function ProductsPage() {
  const products = await getAllActiveProducts()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
          Todos os produtos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{products.length} produtos disponíveis</p>
      </div>
      <ProductGrid products={products} />
    </div>
  )
}
