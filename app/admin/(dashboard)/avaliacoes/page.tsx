import { getAllReviews } from "@/lib/reviews/store"
import { getAllActiveProducts } from "@/lib/queries/products"
import { ReviewsTableView } from "@/components/admin/reviews-table-view"

export const metadata = {
  title: "Gerenciar Avaliações & Depoimentos",
  description: "Gerencie todas as avaliações de clientes e revendedores da Mimos Atacado.",
}

export default async function AdminReviewsPage() {
  const [reviews, activeProducts] = await Promise.all([
    getAllReviews(),
    getAllActiveProducts(),
  ])

  const productOptions = activeProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
  }))

  return <ReviewsTableView initialReviews={reviews} products={productOptions} />
}
