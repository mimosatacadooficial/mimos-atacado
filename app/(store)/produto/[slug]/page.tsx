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
  return {
    title: `${product.name} no atacado | Mimos Atacado`,
    description: product.description || `Compre ${product.name} no atacado com preços exclusivos para revenda.`,
    openGraph: {
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.basePriceCents / 100).toFixed(2),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

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
        </div>
      </div>
    </div>
  )
}
