import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mimos Atacado',
    short_name: 'Mimos Atacado',
    description: 'Maquiagem e Cosméticos no Atacado para Revenda',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#fdf1f5',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
