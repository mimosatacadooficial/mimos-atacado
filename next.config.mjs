/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
