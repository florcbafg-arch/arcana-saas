'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  | 'trial-expired'
  | 'error'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [accessState, setAccessState] =
    useState<AccessState>('loading')

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // 1️⃣ Validar sesión
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          setAccessState('error')
          return
        }

        if (!user) {
          setAccessState('no-session')
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

        // 4️⃣ Validar suscripción
        const { data: business, error: businessError } =
          await supabase
            .from('businesses')
            .select('trial_end, subscription_active')
            .eq('id', activeId)
            .single()

        if (businessError || !business) {
          setAccessState('error')
          return
        }

        const now = new Date()

        if (
          !business.subscription_active &&
          business.trial_end &&
          new Date(business.trial_end) < now
        ) {
          setAccessState('trial-expired')
          return
        }

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

    if (accessState === 'trial-expired') {
      router.replace('/upgrade')
    }
  }, [accessState, router])

  if (accessState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0B0F] text-white">
        Verificando acceso...
      </div>
    )
  }

  if (accessState === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0B0F] text-red-500">
        Error verificando acceso. Intentá nuevamente.
      </div>
    )
  }

  if (accessState !== 'authorized') return null

  return (
  <div className="min-h-screen bg-[#0B0B0F] md:flex">
    <div className="hidden md:block">
      <Sidebar />
    </div>

    <main className="flex-1 w-full p-4 md:p-6 pb-24 md:pb-6">
      {children}
    </main>

    <div className="hidden md:block">
      <SupportButton />
    </div>

    <ErrorDetector />

    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1F1F24] bg-[#0F0F14]/95 backdrop-blur px-2 py-2">
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <Link
          href="/dashboard"
          className="rounded-xl px-2 py-3 text-white bg-[#1F6BFF]/15 border border-[#1F6BFF]/30"
        >
          Inicio
        </Link>

        <Link
          href="/dashboard/productos"
          className="rounded-xl px-2 py-3 text-gray-300 bg-[#14141A] border border-[#1F1F24]"
        >
          Productos
        </Link>

        <Link
          href="/dashboard/stock"
          className="rounded-xl px-2 py-3 text-gray-300 bg-[#14141A] border border-[#1F1F24]"
        >
          Stock
        </Link>

        <Link
          href="/dashboard/ventas"
          className="rounded-xl px-2 py-3 text-gray-300 bg-[#14141A] border border-[#1F1F24]"
        >
          Ventas
        </Link>
      </div>
    </nav>
  </div>
)
}