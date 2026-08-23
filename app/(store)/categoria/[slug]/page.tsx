import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"
import { getProductsByCategorySlug } from "@/lib/queries/products"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { category } = await getProductsByCategorySlug(slug)
  if (!category) return {}
  return {
    title: `${category.name} no atacado | Mimos Atacado`,
    description: category.description || `Compre ${category.name} no atacado com preços exclusivos para revenda.`,
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { category, products } = await getProductsByCategorySlug(slug)

  if (!category) notFound()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>
      <ProductGrid products={products} />
    </div>
  )
}
