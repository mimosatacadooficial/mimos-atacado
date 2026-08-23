import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { Outfit, Inter } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
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
  title: 'Mimos Atacado | Maquiagem e Beleza no Atacado para Revenda',
  description:
    'Compre maquiagem, skincare, perfumaria e acessórios de beleza no atacado com preços exclusivos para revenda. Descontos progressivos por quantidade e entrega para todo o Brasil.',
  generator: 'v0.app',
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
      <body className="font-sans antialiased">
        <CartProvider>{children}</CartProvider>
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
