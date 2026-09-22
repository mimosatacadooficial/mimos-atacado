export interface MockCategory {
  id: number
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  sortOrder: number
  createdAt: Date
}

export interface MockPriceTier {
  minQuantity: number
  priceCents: number
}

export interface MockProduct {
  id: number
  categoryId: number
  categoryName: string
  categorySlug: string
  name: string
  slug: string
  description: string
  basePriceCents: number
  compareAtPriceCents: number
  images: string[]
  stock: number
  minQuantity: number
  isActive: boolean
  isFeatured: boolean
  sku: string
  priceTiers: MockPriceTier[]
  createdAt: Date
  updatedAt: Date
}

export interface MockBanner {
  id: number
  title: string
  subtitle?: string | null
  imageUrl: string
  linkUrl: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
}

export const DEFAULT_CATEGORIES: MockCategory[] = [
  {
    id: 1,
    name: "Maquiagem",
    slug: "maquiagem",
    description: "Bases, batons, sombras e kits de maquiagem completos no atacado.",
    imageUrl: "/categories/maquiagem.png",
    sortOrder: 1,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: 2,
    name: "Pincéis e Acessórios",
    slug: "pinceis-acessorios",
    description: "Pincéis profissionais, esponjas blender e acessórios para aplicação.",
    imageUrl: "/categories/pinceis.png",
    sortOrder: 2,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: 3,
    name: "Skincare",
    slug: "skincare",
    description: "Séruns, protetores solares, hidratantes e cuidados com a pele.",
    imageUrl: "/categories/skincare.png",
    sortOrder: 3,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: 4,
    name: "Perfumaria",
    slug: "perfumaria",
    description: "Perfumes femininos e masculinos com excelente fixação.",
    imageUrl: "/categories/perfumaria.png",
    sortOrder: 4,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: 5,
    name: "Cabelo",
    slug: "cabelo",
    description: "Óleos reparadores, tratamentos e finalizadores capilares.",
    imageUrl: "/categories/cabelo.png",
    sortOrder: 5,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: 6,
    name: "Unhas",
    slug: "unhas",
    description: "Esmaltes, kits e acessórios para unhas e manicure.",
    imageUrl: "/categories/unhas.png",
    sortOrder: 6,
    createdAt: new Date("2026-01-01"),
  },
]

export const DEFAULT_BANNERS: MockBanner[] = [
  {
    id: 1,
    title: "Compre no atacado, revenda com lucro",
    subtitle: "Preços exclusivos de fábrica para lojistas e revendedores",
    imageUrl: "https://pub-0699ca4d5fb640d287426a3a3ca4eba6.r2.dev/banner%201%20make.webp",
    linkUrl: "/produtos",
    sortOrder: 1,
    isActive: true,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: 2,
    title: "Descontos progressivos por quantidade",
    subtitle: "Quanto mais você compra, menor é o preço unitário",
    imageUrl: "https://pub-0699ca4d5fb640d287426a3a3ca4eba6.r2.dev/banner%202%20make.webp",
    linkUrl: "/produtos",
    sortOrder: 2,
    isActive: true,
    createdAt: new Date("2026-01-01"),
  },
]

export const DEFAULT_PRODUCTS: MockProduct[] = [
  {
    id: 1,
    categoryId: 2,
    categoryName: "Pincéis e Acessórios",
    categorySlug: "pinceis-acessorios",
    name: "Kit Pincéis Profissional 12 Peças",
    slug: "kit-pinceis-profissional-12-pecas",
    description: "Kit completo de pincéis profissionais para maquiagem com 12 peças em estojo elegante. Cerdas sintéticas ultra macias e de alta durabilidade para acabamento impecável.",
    basePriceCents: 3990,
    compareAtPriceCents: 5990,
    images: ["/products/kit-pinceis.png"],
    stock: 120,
    minQuantity: 3,
    isActive: true,
    isFeatured: true,
    sku: "PIN-12PC-01",
    priceTiers: [
      { minQuantity: 3, priceCents: 3990 },
      { minQuantity: 6, priceCents: 3590 },
      { minQuantity: 12, priceCents: 3190 },
    ],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: 2,
    categoryId: 2,
    categoryName: "Pincéis e Acessórios",
    categorySlug: "pinceis-acessorios",
    name: "Esponja de Maquiagem Blender",
    slug: "esponja-maquiagem-blender",
    description: "Esponja gota formato beauty blender de alta densidade para aplicação uniforme de base e corretivo. Não absorve produto em excesso.",
    basePriceCents: 590,
    compareAtPriceCents: 990,
    images: ["/products/esponja-blender.png"],
    stock: 500,
    minQuantity: 24,
    isActive: true,
    isFeatured: true,
    sku: "ESP-BLD-02",
    priceTiers: [
      { minQuantity: 24, priceCents: 590 },
      { minQuantity: 48, priceCents: 490 },
      { minQuantity: 100, priceCents: 390 },
    ],
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-02"),
  },
  {
    id: 3,
    categoryId: 3,
    categoryName: "Skincare",
    categorySlug: "skincare",
    name: "Sérum Facial Vitamina C",
    slug: "serum-facial-vitamina-c",
    description: "Sérum facial antioxidante com Vitamina C pura 10% e Ácido Hialurônico para uniformização do tom da pele, hidratação profunda e luminosidade radiante.",
    basePriceCents: 2790,
    compareAtPriceCents: 3990,
    images: ["/products/serum-vitamina-c.png"],
    stock: 80,
    minQuantity: 6,
    isActive: true,
    isFeatured: true,
    sku: "SKN-VITC-03",
    priceTiers: [
      { minQuantity: 6, priceCents: 2790 },
      { minQuantity: 12, priceCents: 2490 },
      { minQuantity: 24, priceCents: 2190 },
    ],
    createdAt: new Date("2026-01-03"),
    updatedAt: new Date("2026-01-03"),
  },
  {
    id: 4,
    categoryId: 3,
    categoryName: "Skincare",
    categorySlug: "skincare",
    name: "Protetor Solar Facial FPS 50",
    slug: "protetor-solar-facial-fps-50",
    description: "Protetor solar facial toque seco com alta proteção UVA/UVB FPS 50. Resistente à água, absorção rápida e controle de oleosidade.",
    basePriceCents: 2190,
    compareAtPriceCents: 2990,
    images: ["/products/protetor-solar.png"],
    stock: 150,
    minQuantity: 12,
    isActive: true,
    isFeatured: true,
    sku: "SKN-FPS50-04",
    priceTiers: [
      { minQuantity: 12, priceCents: 2190 },
      { minQuantity: 24, priceCents: 1990 },
      { minQuantity: 50, priceCents: 1790 },
    ],
    createdAt: new Date("2026-01-04"),
    updatedAt: new Date("2026-01-04"),
  },
  {
    id: 5,
    categoryId: 4,
    categoryName: "Perfumaria",
    categorySlug: "perfumaria",
    name: "Perfume Feminino Floral 100ml",
    slug: "perfume-feminino-floral-100ml",
    description: "Fragrância feminina marcante com notas florais nobres e fundo levemente amadeirado. Fixação prolongada em elegante frasco de 100ml.",
    basePriceCents: 4990,
    compareAtPriceCents: 6990,
    images: ["/products/perfume-floral.png"],
    stock: 60,
    minQuantity: 3,
    isActive: true,
    isFeatured: true,
    sku: "PER-FLOR-05",
    priceTiers: [
      { minQuantity: 3, priceCents: 4990 },
      { minQuantity: 6, priceCents: 4590 },
      { minQuantity: 12, priceCents: 4190 },
    ],
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-01-05"),
  },
  {
    id: 6,
    categoryId: 5,
    categoryName: "Cabelo",
    categorySlug: "cabelo",
    name: "Óleo Capilar Reparador",
    slug: "oleo-capilar-reparador",
    description: "Óleo capilar nutritivo enriquecido com óleo de argan e macadâmia. Reduz o frizz, sela pontas duplas e confere brilho intenso sem pesar.",
    basePriceCents: 1690,
    compareAtPriceCents: 2390,
    images: ["/products/oleo-capilar.png"],
    stock: 90,
    minQuantity: 6,
    isActive: true,
    isFeatured: true,
    sku: "CAB-OLEO-06",
    priceTiers: [
      { minQuantity: 6, priceCents: 1690 },
      { minQuantity: 12, priceCents: 1490 },
      { minQuantity: 24, priceCents: 1290 },
    ],
    createdAt: new Date("2026-01-06"),
    updatedAt: new Date("2026-01-06"),
  },
  {
    id: 7,
    categoryId: 1,
    categoryName: "Maquiagem",
    categorySlug: "maquiagem",
    name: "Kit de maquiagem 40 itens - Para Revender",
    slug: "paleta-sombras-12-cores",
    description: "Kit completo de maquiagem no atacado contendo 40 itens sortidos de alta saída comercial: bases, batons, sombras, blushes e acessórios ideais para revenda lucrativa.",
    basePriceCents: 5384,
    compareAtPriceCents: 9480,
    images: ["https://pub-0699ca4d5fb640d287426a3a3ca4eba6.r2.dev/kit%20independencia%20financeira.webp"],
    stock: 45,
    minQuantity: 1,
    isActive: true,
    isFeatured: true,
    sku: "KIT-MAKE-40PC",
    priceTiers: [
      { minQuantity: 1, priceCents: 5384 },
      { minQuantity: 3, priceCents: 3990 },
      { minQuantity: 5, priceCents: 1990 },
    ],
    createdAt: new Date("2026-01-07"),
    updatedAt: new Date("2026-01-07"),
  },
  {
    id: 8,
    categoryId: 2,
    categoryName: "Pincéis e Acessórios",
    categorySlug: "pinceis-acessorios",
    name: "Kit de esponjas Beauty Blender 360º - Kit com 10",
    slug: "kit-esponja-coxinha-12-unidades-beauty-blender",
    description: "Kit promocional contendo 10 esponjas modelo 360 graus para aplicação uniforme de maquiagem líquida e cremosa.",
    basePriceCents: 1290,
    compareAtPriceCents: 2546,
    images: ["https://pub-0699ca4d5fb640d287426a3a3ca4eba6.r2.dev/esponja%20360.webp"],
    stock: 110,
    minQuantity: 1,
    isActive: true,
    isFeatured: true,
    sku: "ESP-360-10PC",
    priceTiers: [
      { minQuantity: 1, priceCents: 1290 },
      { minQuantity: 3, priceCents: 990 },
      { minQuantity: 5, priceCents: 690 },
    ],
    createdAt: new Date("2026-01-08"),
    updatedAt: new Date("2026-01-08"),
  },
  {
    id: 9,
    categoryId: 1,
    categoryName: "Maquiagem",
    categorySlug: "maquiagem",
    name: "Kit de maquiagem 38 itens com acessórios extras - Para Revender",
    slug: "base-liquida-matte",
    description: "Kit revenda super premium com 38 itens sortidos incluindo paletas, bases e pincéis extras para pronta entrega.",
    basePriceCents: 6354,
    compareAtPriceCents: 12784,
    images: ["https://pub-0699ca4d5fb640d287426a3a3ca4eba6.r2.dev/kit%20acessorios.webp"],
    stock: 35,
    minQuantity: 1,
    isActive: true,
    isFeatured: true,
    sku: "KIT-MAKE-38PC",
    priceTiers: [
      { minQuantity: 1, priceCents: 6354 },
      { minQuantity: 3, priceCents: 5490 },
      { minQuantity: 5, priceCents: 4780 },
    ],
    createdAt: new Date("2026-01-09"),
    updatedAt: new Date("2026-01-09"),
  },
  {
    id: 10,
    categoryId: 2,
    categoryName: "Pincéis e Acessórios",
    categorySlug: "pinceis-acessorios",
    name: "Esponja Coxinha para Maquiagem PL02 – Pcte c/ 12 unidades",
    slug: "kit-esponja-coxinha-12-unidades",
    description: "Pacote no atacado com 12 esponjas formato coxinha modelo PL02 em cores variadas para maquiadores e revendedores.",
    basePriceCents: 1190,
    compareAtPriceCents: 2384,
    images: ["https://pub-0699ca4d5fb640d287426a3a3ca4eba6.r2.dev/kit%20de%20esponja%20coxinha.webp"],
    stock: 140,
    minQuantity: 1,
    isActive: true,
    isFeatured: true,
    sku: "ESP-COX-12PC",
    priceTiers: [
      { minQuantity: 1, priceCents: 1190 },
      { minQuantity: 3, priceCents: 890 },
      { minQuantity: 5, priceCents: 690 },
    ],
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
  },
]
