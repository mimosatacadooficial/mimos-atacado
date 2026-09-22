import type { Metadata } from "next"
import { ProductGrid } from "@/components/product-grid"
import { getAllActiveProducts } from "@/lib/queries/products"

export const metadata: Metadata = {
  title: "Maquiagem e Cosméticos no Atacado para Revenda | Catálogo Completo",
  description:
    "Confira nosso catálogo completo de maquiagem, skincare, produtos para cabelo, unhas e perfumaria no atacado com preços de fábrica para revendedoras e lojistas.",
  alternates: {
    canonical: "/produtos",
  },
  keywords: [
    "comprar maquiagem no atacado",
    "maquiagem atacado online",
    "cosmeticos para revenda",
    "produtos de beleza no atacado",
    "fornecedor de maquiagem",
    "distribuidora de cosmeticos",
    "kit maquiagem revenda",
    "maquiagem barata atacado",
    "produtos para revender com lucro",
  ],
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
