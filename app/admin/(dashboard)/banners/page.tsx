import Image from "next/image"
import { getAdminBanners } from "@/lib/queries/admin"
import { BannerFormDialog } from "@/components/admin/banner-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ImageIcon } from "lucide-react"

export default async function AdminBannersPage() {
  const bannerList = await getAdminBanners()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Banners</h1>
          <p className="text-sm text-muted-foreground">Gerencie os banners da página inicial.</p>
        </div>
        <BannerFormDialog />
      </div>

      {bannerList.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhum banner cadastrado</EmptyTitle>
            <EmptyDescription>Crie um banner para exibir na página inicial.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bannerList.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-xl border border-border">
              <div className="relative h-32 w-full bg-muted">
                <Image src={banner.imageUrl || "/placeholder.svg"} alt={banner.title} fill className="object-cover" />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{banner.title}</p>
                  <p className="text-xs text-muted-foreground">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={banner.isActive ? "secondary" : "outline"}>
                    {banner.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <BannerFormDialog banner={banner} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
