import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"
import { getProductsByCategorySlug, getAllCategories } from "@/lib/queries/products"
import { SITE_URL } from "@/lib/seo"

export const revalidate = 60

export async function generateStaticParams() {
  const categories = await getAllCategories()
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { category } = await getProductsByCategorySlug(slug)
  if (!category) return {}
  const title = `${category.name} no Atacado para Revenda`
  const description =
    category.description ||
    `Compre ${category.name} no atacado direto da fábrica com descontos progressivos para revender com lucro.`
  return {
    title,
    description,
    alternates: {
      canonical: `/categoria/${slug}`,
    },
    openGraph: {
      title: `Mimos Atacado | ${title}`,
      description,
      images: category.imageUrl ? [category.imageUrl] : [],
    },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { category, products } = await getProductsByCategorySlug(slug)

  if (!category) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${SITE_URL}/categoria/${category.slug}`,
      },
    ],
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
