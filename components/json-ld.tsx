import { getOrganizationSchema, getWebSiteSchema, getFaqSchema } from "@/lib/seo"

export function JsonLd() {
  const orgSchema = getOrganizationSchema()
  const webSiteSchema = getWebSiteSchema()
  const faqSchema = getFaqSchema()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
