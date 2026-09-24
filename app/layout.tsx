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
  display: 'swap',
})

const _inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_CONFIG.title,
    template: 'Mimos Atacado | %s',
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
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/icon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        url: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        url: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon.ico',
    apple: [
      {
        url: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

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
        <link rel="preconnect" href="https://pub-db4e48567ea54fc7b07ee1ddbc1f01eb.r2.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pub-db4e48567ea54fc7b07ee1ddbc1f01eb.r2.dev" />
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
