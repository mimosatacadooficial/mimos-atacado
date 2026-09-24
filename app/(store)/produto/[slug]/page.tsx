import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { AddToCartForm } from "@/components/add-to-cart-form"
import { getProductBySlug, getAllActiveProducts } from "@/lib/queries/products"
import { formatCentsToBRL } from "@/lib/format"
import { SITE_URL } from "@/lib/seo"
import { getReviewsForProduct, getProductRatingSummary } from "@/lib/reviews/store"
import { ProductRatingBadge } from "@/components/reviews/product-rating-badge"
import { ProductReviewsSection } from "@/components/reviews/product-reviews-section"

export const revalidate = 60

export async function generateStaticParams() {
  const products = await getAllActiveProducts()
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  const title = product.name
  const isKit = product.name.toLowerCase().includes("kit")
  const description =
    product.description ||
    `Compre ${product.name} no atacado com preços exclusivos de fábrica para revendedoras e lojistas.`
  return {
    title,
    description,
    keywords: [
      product.name,
      `${product.name} atacado`,
      `${product.name} no atacado`,
      `${product.name} para revenda`,
      `${product.name} para revender`,
      `${product.name} barato`,
      isKit ? "kit de maquiagem atacado" : "",
      isKit ? "kit maquiagem revenda" : "",
      isKit ? "kit maquiagem para revender" : "",
      isKit ? "kit maquiagem atacado barato" : "",
      isKit ? "kit para revendedora de maquiagem" : "",
      product.categoryName ? `${product.categoryName} atacado` : "",
      "maquiagem atacado",
      "cosméticos para revenda",
      "produtos de beleza no atacado",
    ].filter(Boolean),
    alternates: {
      canonical: `/produto/${product.slug}`,
    },
    openGraph: {
      title: `Mimos Atacado | ${title}`,
      description,
      url: `${SITE_URL}/produto/${product.slug}`,
      images: product.images[0] ? [product.images[0]] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `Mimos Atacado | ${title}`,
      description,
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const [reviews, ratingSummary] = await Promise.all([
    getReviewsForProduct(product.slug, true),
    getProductRatingSummary(product.slug),
  ])

  const lowestPriceCents = product.priceTiers?.length
    ? Math.min(...product.priceTiers.map((t) => t.priceCents))
    : product.basePriceCents

  const productUrl = `${SITE_URL}/produto/${product.slug}`

  const breadcrumbsList = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Início",
      item: SITE_URL,
    },
  ]

  if (product.categorySlug) {
    breadcrumbsList.push({
      "@type": "ListItem",
      position: 2,
      name: product.categoryName || "Categoria",
      item: `${SITE_URL}/categoria/${product.categorySlug}`,
    })
  }

  breadcrumbsList.push({
    "@type": "ListItem",
    position: breadcrumbsList.length + 1,
    name: product.name,
    item: productUrl,
  })

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbsList,
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || `Compre ${product.name} no atacado para revenda com lucro na Mimos Atacado.`,
      image: product.images,
      sku: product.sku || `MIMOS-${product.id}`,
      brand: {
        "@type": "Brand",
        name: "Mimos Atacado",
      },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "BRL",
        lowPrice: (lowestPriceCents / 100).toFixed(2),
        highPrice: (product.basePriceCents / 100).toFixed(2),
        offerCount: product.priceTiers?.length || 1,
        availability:
          product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: "Mimos Atacado",
        },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ratingSummary.averageRating.toFixed(1),
        reviewCount: Math.max(1, ratingSummary.totalReviews),
        bestRating: "5",
        worstRating: "1",
      },
      ...(reviews.length > 0
        ? {
            review: reviews.slice(0, 10).map((r) => ({
              "@type": "Review",
              author: {
                "@type": "Person",
                name: r.authorName,
              },
              datePublished: r.createdAt.split("T")[0],
              reviewRating: {
                "@type": "Rating",
                ratingValue: r.rating.toString(),
                bestRating: "5",
                worstRating: "1",
              },
              name: r.title,
              reviewBody: r.comment,
            })),
          }
        : {}),
    },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3" />
        {product.categorySlug && (
          <>
            <Link href={`/categoria/${product.categorySlug}`} className="hover:text-primary">
              {product.categoryName}
            </Link>
            <ChevronRight className="size-3" />
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-secondary/40">
          <Image
            src={product.images[0] || "/placeholder.svg?height=600&width=600&query=beauty product"}
            alt={product.name}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
            <h1 className="font-heading text-2xl font-semibold text-foreground text-balance md:text-3xl">
              {product.name}
            </h1>
            <div className="mt-2.5">
              <ProductRatingBadge summary={ratingSummary} variant="full" />
            </div>
            {product.compareAtPriceCents && product.compareAtPriceCents > product.basePriceCents && (
              <p className="mt-2 text-sm text-muted-foreground line-through">
                {formatCentsToBRL(product.compareAtPriceCents)}
              </p>
            )}
          </div>

          <AddToCartForm
            productId={product.id}
            slug={product.slug}
            name={product.name}
            image={product.images[0] || "/placeholder.svg"}
            basePriceCents={product.basePriceCents}
            minQuantity={product.minQuantity}
            priceTiers={product.priceTiers}
          />

          <p className="text-xs text-muted-foreground">
            {product.stock > 0 ? `${product.stock} unidades em estoque` : "Produto esgotado"}
          </p>

          {product.description && (
            <div className="flex flex-col gap-2 border-t border-border/60 pt-5">
              <h2 className="font-heading text-base font-semibold text-foreground">Descrição</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Avaliações de Clientes & Revendedores */}
      <ProductReviewsSection
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
        reviews={reviews}
        summary={ratingSummary}
      />
    </div>
  )
}
