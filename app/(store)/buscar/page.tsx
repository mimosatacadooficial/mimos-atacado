import type { Metadata } from "next"
import { ProductGrid } from "@/components/product-grid"
import { SearchPageInput } from "@/components/search-page-input"
import { searchProducts } from "@/lib/queries/products"

export const metadata: Metadata = {
  title: "Buscar Produtos no Atacado",
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
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
            {query ? `Resultados para "${query}"` : "Buscar produtos no atacado"}
          </h1>
          {query && (
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
          )}
        </div>

        <SearchPageInput initialQuery={query} />
      </div>

      <ProductGrid products={products} />
    </div>
  )
}
