import Image from "next/image"
import Link from "next/link"

type Banner = {
  id: number
  title: string
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
}

export function HeroBanner({ banner }: { banner: Banner }) {
  return (
    <Link
      href={banner.linkUrl || "/produtos"}
      aria-label={banner.title}
      className="relative block aspect-[16/9] w-full md:aspect-[21/9]"
    >
      <Image
        src={banner.imageUrl || "/placeholder.svg"}
        alt={banner.title}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
    </Link>
  )
}
