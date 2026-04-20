// @ts-ignore
import './globals.css'

import { Inter, Orbitron } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-orbitron',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${orbitron.variable}`}>
        {children}
      </body>
    </html>
  )
}