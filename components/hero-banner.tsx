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
    <Link href={banner.linkUrl || "/produtos"} aria-label={banner.title} className="block w-full">
      {/* Mobile: fill a shorter, fixed-ratio frame (object-cover) so the banner
          reads as a bold rectangle instead of a thin sliver. Desktop: the artwork
          is wide enough that its natural ratio already looks right, so it's
          shown uncropped from sm and up. */}
      <img
        src={banner.imageUrl || "/placeholder.svg"}
        alt={banner.title}
        className="block aspect-[2/1] w-full object-cover object-center sm:aspect-auto sm:h-auto"
      />
    </Link>
  )
}
