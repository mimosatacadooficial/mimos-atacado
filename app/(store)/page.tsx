import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Percent, Truck, Sparkles } from "lucide-react"
import { HeroBanner } from "@/components/hero-banner"
import { ProductCard } from "@/components/product-card"
import { getActiveBanners } from "@/lib/queries/banners"
import { getAllCategories, getFeaturedProducts } from "@/lib/queries/products"

export default async function HomePage() {
  const [banners, categories, featuredProducts] = await Promise.all([
    getActiveBanners(),
    getAllCategories(),
    getFeaturedProducts(8),
  ])

  return (
    <div className="flex flex-col gap-14 py-8 md:py-10">
      {banners[0] && <HeroBanner banner={banners[0]} />}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 md:px-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <Percent className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Descontos progressivos</p>
            <p className="text-xs text-muted-foreground">Quanto mais compra, menor o preço</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <Truck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Entrega para todo o Brasil</p>
            <p className="text-xs text-muted-foreground">Enviamos para todos os estados</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Feito para revendedoras</p>
            <p className="text-xs text-muted-foreground">Produtos de qualidade a preço de atacado</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-xl font-semibold text-foreground md:text-2xl">Categorias</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center transition-all hover:border-primary/40 hover:shadow-[0_8px_24px_-10px_var(--glow-color)]"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary/40">
                <Image
                  src={c.imageUrl || "/placeholder.svg"}
                  alt={c.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="150px"
                />
              </div>
              <span className="text-xs font-medium text-foreground md:text-sm">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>
      </div>

      {banners[1] && <HeroBanner banner={banners[1]} />}

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
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      </div>
    </div>
  )
}
