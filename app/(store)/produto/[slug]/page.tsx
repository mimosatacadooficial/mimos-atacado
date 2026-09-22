import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { AddToCartForm } from "@/components/add-to-cart-form"
import { getProductBySlug } from "@/lib/queries/products"
import { formatCentsToBRL } from "@/lib/format"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  const title = product.name
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
      product.categoryName ? `${product.categoryName} atacado` : "",
      "maquiagem atacado",
      "cosméticos para revenda",
      "produtos de beleza no atacado",
    ].filter(Boolean),
    alternates: {
      canonical: `/produto/${slug}`,
    },
    openGraph: {
      title: `Mimos Atacado | ${title}`,
      description,
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

  const lowestPriceCents = product.priceTiers?.length
    ? Math.min(...product.priceTiers.map((t) => t.priceCents))
    : product.basePriceCents

  const jsonLd = {
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
  }

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
            {product.compareAtPriceCents && product.compareAtPriceCents > product.basePriceCents && (
              <p className="mt-1 text-sm text-muted-foreground line-through">
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
    </div>
  )
}
