// @ts-ignore
import './globals.css'

import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'Arcana POS',
  description: 'Sistema POS para ventas, stock y productos.',

  manifest: '/manifest.json',

  themeColor: '#0B0B10',

  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  )
}