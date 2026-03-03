'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 🔴 No autenticado
      if (!user) {
        router.push('/login')
        return
      }

      // 🔵 Verificar negocio
      const { data: businesses } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)

      if (!businesses || businesses.length === 0) {
        router.push('/onboarding')
        return
      }

     // 🟢 Manejar activeBusinessId
let activeId = localStorage.getItem('activeBusinessId')

const validBusinessIds = businesses.map(b => b.business_id)

// 🔐 Si no existe o no pertenece al usuario
if (!activeId || !validBusinessIds.includes(activeId as string)) {
  activeId = validBusinessIds[0]
}

// 👇 ahora sí lo guardamos seguro
localStorage.setItem('activeBusinessId', activeId as string)

// 🔥 TRAER BUSINESS ACTIVO
const { data: business } = await supabase
  .from('businesses')
  .select('trial_end, subscription_active')
  .eq('id', activeId)
  .single()

if (!business) {
  router.push('/onboarding')
  return
}

// 🔥 VERIFICAR TRIAL
const now = new Date()

if (
  !business.subscription_active &&
  business.trial_end &&
  new Date(business.trial_end) < now
) {
  router.push('/upgrade')
  return
}

      setLoading(false)
    }

    checkAccess()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0B0F] text-white">
        Verificando acceso...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0B0B0F]">
      <Sidebar />
      <main className="flex-1 p-6 w-full">
        {children}
      </main>
    </div>
  )
}