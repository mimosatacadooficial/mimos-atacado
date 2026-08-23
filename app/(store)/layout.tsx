import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getAllCategories } from "@/lib/queries/products"

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = await getAllCategories()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
