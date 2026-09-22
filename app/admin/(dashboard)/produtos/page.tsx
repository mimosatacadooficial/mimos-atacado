import { getAdminProducts } from "@/lib/queries/admin"
import { ProductsTableView } from "@/components/admin/products-table-view"

export const metadata = {
  title: "Gerenciar Produtos",
  description: "Gerencie todos os produtos cadastrados para revenda no atacado.",
}

export default async function AdminProductsPage() {
  const productList = await getAdminProducts()

  return <ProductsTableView initialProducts={productList} />
}
