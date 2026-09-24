/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.awsli.com.br",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/produtos/:slug",
        destination: "/produto/:slug",
        permanent: true,
      },
      {
        source: "/p/:slug",
        destination: "/produto/:slug",
        permanent: true,
      },
      {
        source: "/produto/base-liquida-matte",
        destination: "/produto/kit-de-maquiagem-38-itens-com-acessorios-extras-para-revender",
        permanent: true,
      },
      {
        source: "/produto/paleta-sombras-12-cores",
        destination: "/produto/kit-de-maquiagem-40-itens-para-revender",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
