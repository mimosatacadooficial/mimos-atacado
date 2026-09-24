import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

export const revalidate = 86400

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = SITE_URL

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/*",
          "/api/",
          "/api/*",
          "/carrinho",
          "/checkout",
          "/pagamento",
          "/pedido-confirmado",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
