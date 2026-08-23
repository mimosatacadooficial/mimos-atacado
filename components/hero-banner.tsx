import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Percent, ShieldCheck, Truck } from "lucide-react"

type Banner = {
  id: number
  title: string
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
}

const TRUST_BADGES = [
  { icon: Truck, label: "Produtos a pronta entrega" },
  { icon: Percent, label: "Preços imbatíveis" },
  { icon: ShieldCheck, label: "Variedade e qualidade" },
]

export function HeroBanner({ banner }: { banner: Banner }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60">
      <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
        <Image
          src={banner.imageUrl || "/placeholder.svg"}
          alt={banner.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      </div>

      {/* Trust badges, left rail - hidden on small screens to keep the banner uncluttered */}
      <div className="absolute inset-y-0 left-0 hidden w-56 flex-col justify-center gap-5 bg-gradient-to-r from-background/95 via-background/85 to-transparent px-6 lg:flex">
        {TRUST_BADGES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground glow-sm">
              <Icon className="size-5" />
            </span>
            <p className="text-shadow-glow text-sm font-bold leading-tight text-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center">
        <div className="flex max-w-md flex-col gap-3 px-6 md:px-12 lg:max-w-lg lg:pl-64">
          <h1 className="text-shadow-glow font-heading text-2xl font-semibold leading-tight text-foreground md:text-4xl">
            {banner.title}
          </h1>
          {banner.subtitle && (
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{banner.subtitle}</p>
          )}
          <Button
            render={<Link href={banner.linkUrl || "/produtos"} />}
            nativeButton={false}
            size="lg"
            className="mt-2 w-fit glow-sm"
          >
            Ver produtos
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </section>
  )
}
