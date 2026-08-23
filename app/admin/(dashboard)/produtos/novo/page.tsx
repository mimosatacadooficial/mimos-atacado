import { getAdminCategories } from "@/lib/queries/admin"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
  const categories = await getAdminCategories()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Novo produto</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo produto na loja.</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}
