import { notFound } from "next/navigation"
import { getAdminCategories } from "@/lib/queries/admin"
import { getProductWithTiers } from "@/app/actions/admin-products"
import { ProductForm } from "@/components/admin/product-form"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [categories, data] = await Promise.all([getAdminCategories(), getProductWithTiers(Number(id))])

  if (!data) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Editar produto</h1>
        <p className="text-sm text-muted-foreground">{data.product.name}</p>
      </div>
      <ProductForm
        categories={categories}
        initialProduct={data.product}
        initialTiers={data.tiers.map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents }))}
        initialCategoryIds={data.categoryIds}
      />
    </div>
  )
}
