import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { Outfit, Inter } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
import { UtmCapture } from '@/components/utm-capture'
import { JsonLd } from '@/components/json-ld'
import { SITE_CONFIG, SITE_URL, SEO_KEYWORDS } from '@/lib/seo'
import './globals.css'

const _outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
})

const _inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_CONFIG.title,
    template: '%s | Mimos Atacado',
  },
  description: SITE_CONFIG.description,
  keywords: SEO_KEYWORDS,
  applicationName: 'Mimos Atacado',
  authors: [{ name: 'Mimos Atacado' }],
  creator: 'Mimos Atacado',
  publisher: 'Mimos Atacado',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: 'Mimos Atacado - Maquiagem e Cosméticos no Atacado para Revenda',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fdf1f5',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${_outfit.variable} ${_inter.variable} bg-background`}>
      <head>
        <JsonLd />
      </head>
      <body className="font-sans antialiased">
        <UtmCapture />
        <CartProvider>{children}</CartProvider>
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
