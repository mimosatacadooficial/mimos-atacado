import { MetadataRoute } from "next"
import { headers } from "next/headers"
import { SITE_URL } from "@/lib/seo"

export const dynamic = "force-dynamic"

export default async function robots(): Promise<MetadataRoute.Robots> {
  let baseUrl = SITE_URL
  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") || h.get("host")
    const proto = h.get("x-forwarded-proto") || "https"
    if (host && !host.includes("localhost")) {
      baseUrl = `${proto}://${host}`
    }
  } catch {
    baseUrl = SITE_URL
  }

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
