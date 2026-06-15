'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './components/Sidebar'
import SupportButton from './components/SupportButton'
import ErrorDetector from './components/ErrorDetector'
import Link from 'next/link'

type AccessState =
  | 'loading'
  | 'authorized'
  | 'no-session'
  | 'no-business'
  | 'error'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [accessState, setAccessState] =
    useState<AccessState>('loading')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const clearSessionAndRedirect = async () => {
  localStorage.removeItem('activeBusinessId')
  localStorage.removeItem('businessName')
  localStorage.removeItem('lastSessionCheck')

  await supabase.auth.signOut()

  router.replace('/login')
}

const handleLogout = async () => {
  await clearSessionAndRedirect()
}

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // 1️⃣ Validar sesión
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
  await clearSessionAndRedirect()
  return
}

        if (!user) {
  await clearSessionAndRedirect()
  return
}

        // 2️⃣ Validar membresía
        const { data: businesses, error } = await supabase
          .from('business_users')
          .select('business_id')
          .eq('user_id', user.id)

        if (error) {
          setAccessState('error')
          return
        }

        if (!businesses || businesses.length === 0) {
          setAccessState('no-business')
          return
        }

        // 3️⃣ Resolver negocio activo seguro
        const validBusinessIds = businesses.map(
          (b) => b.business_id
        )

        let activeId = validBusinessIds[0]

        const storedId = localStorage.getItem('activeBusinessId')

        if (storedId && validBusinessIds.includes(storedId)) {
          activeId = storedId
        }

        localStorage.setItem('activeBusinessId', activeId)

        const { data: businessInfo } = await supabase
  .from('businesses')
  .select('name')
  .eq('id', activeId)
  .single()

if (businessInfo?.name) {
  localStorage.setItem('businessName', businessInfo.name)
}

        // 4️⃣ Validar suscripción
        const { data: business, error: businessError } =
          await supabase
            .from('businesses')
            .select('plan_type, subscription_active')
            .eq('id', activeId)
            .single()

        if (businessError || !business) {
          setAccessState('error')
          return
        }

        if (!business.subscription_active) {
  router.replace('/upgrade')
  return
}

setIsPro(business.plan_type === 'impulso')

setAccessState('authorized')

        setAccessState('authorized')
      } catch (err) {
        setAccessState('error')
      }
    }

    validateAccess()
  }, [])

  // 🔁 Redirecciones controladas
  useEffect(() => {
    if (accessState === 'no-session') {
      router.replace('/login')
    }

    if (accessState === 'no-business') {
      router.replace('/onboarding')
    }

  }, [accessState, router])



  const mobileNavItems = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Productos', href: '/dashboard/productos' },
  { label: 'Stock', href: '/dashboard/stock' },
  { label: 'Ventas', href: '/dashboard/ventas' },

  ...(isPro
    ? [
        { label: 'Clientes', href: '/dashboard/clientes' },
        { label: 'Compras', href: '/dashboard/compras' },
      ]
    : []),
]

const getMobileNavClass = (href: string) => {
  const isActive =
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)

  return `rounded-xl px-2 py-3 transition ${
    isActive
      ? 'text-white bg-[#1F6BFF]/20 border border-[#1F6BFF]/40 shadow-[0_0_18px_rgba(31,107,255,0.18)]'
      : 'text-gray-300 bg-[#14141A] border border-[#1F1F24]'
  }`
}
if (accessState === 'loading') {

  return (
    <div className="min-h-screen bg-[#08090D] flex items-center justify-center px-6">

      <div className="text-center">

        <div className="mb-6">
  <div className="w-24 h-24 mx-auto rounded-full bg-[#1F6BFF]/20 blur-3xl" />
</div>

        <h1
  className="
    text-3xl
    font-extrabold
    tracking-wide
    bg-gradient-to-r
    from-[#1F6BFF]
    via-[#4F7CFF]
    to-[#8B5CF6]
    bg-clip-text
    text-transparent
  "
>
  Arcana POS
</h1>

        <p className="text-gray-400 mt-3 text-sm">
          Inicializando sistema...
        </p>

        <div className="mt-6 flex justify-center">
          <div className="w-32 h-1 rounded-full bg-[#1A1A22] overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-[#1F6BFF] to-[#6C5CE7] animate-pulse" />
          </div>
        </div>

      </div>

    </div>
  )
}

if (accessState === 'error') {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-6 text-center">
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-8 py-6 text-red-300 shadow-[0_0_40px_rgba(255,92,122,0.08)] backdrop-blur-xl">
        Error verificando acceso. Intentá nuevamente.
      </div>
    </div>
  )
}

  if (accessState !== 'authorized') return null

 return (
  <div className="min-h-screen md:flex bg-gradient-to-br from-[#080F1A] via-[#05070D] to-[#020617]">
  <Sidebar />

{/* ===== HEADER MOBILE ===== */}
<div className="md:hidden sticky top-0 z-40 mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B0F1A]/90 px-4 py-3 backdrop-blur-xl">

  <div>
    <p className="text-sm text-gray-400">
  Arcana POS
</p>

<p className="text-white font-semibold">
  {localStorage.getItem('businessName') || 'Mi negocio'}
</p>
  </div>

  <button
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    className="rounded-xl border border-white/10 bg-[#14141A] px-3 py-2 text-white"
  >
    ☰
  </button>

</div>

{mobileMenuOpen && (
  <div className="md:hidden mb-4 rounded-2xl border border-white/10 bg-[#0B0F1A]/95 p-3 backdrop-blur-xl space-y-2">

    <Link
      href="/dashboard/configuracion"
      className="flex items-center gap-2 rounded-xl bg-[#14141A] px-4 py-3 text-sm text-white"
    >
      ⚙️ Configuración
    </Link>

    <button
      onClick={() => {
        window.open('https://t.me/arcana_soporte', '_blank')
      }}
      className="flex w-full items-center gap-2 rounded-xl bg-[#14141A] px-4 py-3 text-sm text-white"
    >
      💬 Soporte
    </button>

    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300"
    >
      🚪 Cerrar sesión
    </button>

  </div>
)}

    <main className="relative flex-1 min-w-0 w-full md:ml-64 px-4 py-4 md:px-8 md:py-7 pb-24 md:pb-8">
      {children}
    </main>

    <div className="hidden md:block">
      <SupportButton />
    </div>

    <ErrorDetector />

    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0B0F1A]/92 backdrop-blur-xl px-2 py-2">
  <div className="grid grid-cols-4 gap-2 text-center text-xs">
    {mobileNavItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={getMobileNavClass(item.href)}
      >
        {item.label}
      </Link>
    ))}
  </div>
</nav>
  </div>
)
}