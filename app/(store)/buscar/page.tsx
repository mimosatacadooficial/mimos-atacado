import type { Metadata } from "next"
import { ProductGrid } from "@/components/product-grid"
import { searchProducts } from "@/lib/queries/products"

export const metadata: Metadata = {
  title: "Buscar Produtos",
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || ""
  const products = query ? await searchProducts(query) : []

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
          {query ? `Resultados para "${query}"` : "Buscar produtos"}
        </h1>
        {query && <p className="mt-1 text-sm text-muted-foreground">{products.length} produtos encontrados</p>}
      </div>
      <ProductGrid products={products} />
    </div>
  )
}
