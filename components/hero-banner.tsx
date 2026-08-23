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
      {/* Plain img (not next/image) so the banner always renders at its own natural
          aspect ratio - width scales to 100% and height follows automatically,
          which guarantees the artwork is never cropped on any screen size. */}
      <img
        src={banner.imageUrl || "/placeholder.svg"}
        alt={banner.title}
        className="block h-auto w-full"
      />
    </Link>
  )
}
