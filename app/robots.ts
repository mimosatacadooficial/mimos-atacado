import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
