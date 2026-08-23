import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

type Banner = {
  id: number
  title: string
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
}

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
      <div className="absolute inset-0 flex items-center">
        <div className="flex max-w-md flex-col gap-3 px-6 md:px-12">
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
