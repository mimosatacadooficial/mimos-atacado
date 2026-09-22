import keywordsData from "./seo-keywords.json"

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mimosatacado.com.br"

export const SEO_KEYWORDS: string[] = keywordsData

export const SITE_CONFIG = {
  name: "Mimos Atacado",
  legalName: "Mimos Atacado de Maquiagem e Cosméticos",
  alternateNames: [
    "Mimos Atacado Oficial",
    "Distribuidora Mimos Atacado",
    "Mimos Atacado Maquiagem",
    "Mimos Atacado Revenda",
  ],
  url: SITE_URL,
  logo: "https://pub-db4e48567ea54fc7b07ee1ddbc1f01eb.r2.dev/images/logo-mimo-atacado.png",
  ogImage: "https://pub-db4e48567ea54fc7b07ee1ddbc1f01eb.r2.dev/banners/banner-atacado.png",
  title: "Mimos Atacado ✨ Maquiagem no Atacado para Revenda",
  description:
    "✨ Compre maquiagem e cosméticos no atacado direto de fábrica! Melhores marcas para revenda com descontos progressivos e envio rápido para todo o Brasil.",
}

/**
 * Organization and WholesaleStore Schema for rich snippets in Google Search
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["WholesaleStore", "OnlineBusiness", "Organization"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    alternateName: SITE_CONFIG.alternateNames,
    url: SITE_CONFIG.url,
    logo: SITE_CONFIG.logo,
    image: SITE_CONFIG.ogImage,
    description: SITE_CONFIG.description,
    currenciesAccepted: "BRL",
    paymentAccepted: ["PIX", "Cartão de Crédito", "Boleto Bancário"],
    priceRange: "$$",
    areaServed: {
      "@type": "Country",
      name: "Brazil",
    },
    knowsAbout: SEO_KEYWORDS.slice(0, 150),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Catálogo de Produtos no Atacado",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Maquiagem no Atacado",
          description: "Bases, batons, sombras, blushes e kits para revenda",
        },
        {
          "@type": "OfferCatalog",
          name: "Pincéis e Acessórios",
          description: "Pincéis profissionais e esponjas beauty blender no atacado",
        },
        {
          "@type": "OfferCatalog",
          name: "Skincare no Atacado",
          description: "Séruns de vitamina C, protetor solar facial e cuidados com a pele",
        },
        {
          "@type": "OfferCatalog",
          name: "Perfumaria no Atacado",
          description: "Perfumes importados e fragrâncias para revenda",
        },
        {
          "@type": "OfferCatalog",
          name: "Produtos para Cabelo",
          description: "Óleos reparadores e tratamentos capilares",
        },
        {
          "@type": "OfferCatalog",
          name: "Produtos para Unhas",
          description: "Esmaltes e kits para manicure e nail designers",
        },
      ],
    },
  }
}

/**
 * WebSite schema with SearchAction for Sitelinks Searchbox in Google Search
 */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.alternateNames,
    description: SITE_CONFIG.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

/**
 * FAQ Schema for Google Search Rich Results featuring common wholesale questions
 */
export function getFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Onde comprar maquiagem no atacado para revender?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Na Mimos Atacado você encontra maquiagem, cosméticos e produtos de beleza no atacado com preços de fábrica, descontos progressivos e entrega para todo o Brasil.",
        },
      },
      {
        "@type": "Question",
        name: "Qual o pedido mínimo para comprar maquiagem no atacado?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Trabalhamos com quantidades mínimas muito acessíveis para cada produto, permitindo que iniciantes, revendedoras e lojistas comecem seu próprio negócio de maquiagem e beleza com baixo investimento.",
        },
      },
      {
        "@type": "Question",
        name: "Como funciona o desconto progressivo por quantidade?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Quanto maior a quantidade comprada de cada produto, menor o valor unitário pago. Cada produto possui faixas de preço claras para você maximizar sua margem de lucro na revenda.",
        },
      },
      {
        "@type": "Question",
        name: "A Mimos Atacado entrega para todo o Brasil?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! Entregamos maquiagens, cosméticos e produtos capilares em todos os estados do Brasil com agilidade e embalagens protegidas.",
        },
      },
      {
        "@type": "Question",
        name: "Quais são as formas de pagamento aceitas no atacado?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Aceitamos pagamento via PIX instantâneo com aprovação imediata e envio prioritário, além de cartão de crédito e boleto bancário.",
        },
      },
    ],
  }
}
