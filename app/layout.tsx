import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          🚀 Sistema Arcana
        </header>

        <main style={{ padding: 24 }}>
          {children}
        </main>
      </body>
    </html>
  )
}

