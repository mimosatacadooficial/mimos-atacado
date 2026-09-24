import { NextResponse } from "next/server"
import { searchProducts } from "@/lib/queries/products"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim() || ""

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], count: 0 }, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      })
    }

    const products = await searchProducts(query)
    const results = products.slice(0, 8).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePriceCents: p.basePriceCents,
      compareAtPriceCents: p.compareAtPriceCents,
      image: p.images[0] || "/placeholder.svg",
      minQuantity: p.minQuantity,
      categoryName: p.categoryName || "Geral",
    }))

    return NextResponse.json(
      { results, count: products.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    )
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ results: [], count: 0, error: "Search failed" }, { status: 500 })
  }
}
