import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { HeroBanner } from "@/components/hero-banner"
import { ProductCard } from "@/components/product-card"
import { getActiveBanners } from "@/lib/queries/banners"
import { getAllActiveProducts, getFeaturedProducts } from "@/lib/queries/products"

export default async function HomePage() {
  const [banners, allProducts, featuredProducts] = await Promise.all([
    getActiveBanners(),
    getAllActiveProducts(),
    getFeaturedProducts(8),
  ])
  const bestSellers = allProducts.slice(0, 8)

  return (
    <div className="flex flex-col gap-14 py-8 md:py-10">
      {banners[0] && <HeroBanner banner={banners[0]} />}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 md:px-6">
      <section className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-xl font-semibold text-foreground md:text-2xl">Mais vendidos</h2>
          <Link
            href="/produtos"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver tudo
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      </div>

      {banners[1] && <HeroBanner banner={banners[1]} />}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 md:px-6">
      <section className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-xl font-semibold text-foreground md:text-2xl">Ofertas em destaque</h2>
          <Link
            href="/produtos"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver tudo
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      </div>
    </div>
  )
}
