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

    if (!user) {
      return // 👈 NO redirigimos todavía
    }

    const { data: businesses, error } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', user.id)

    if (error || !businesses || businesses.length === 0) {
      router.replace('/onboarding')
      return
    }

    const validBusinessIds = businesses.map(b => b.business_id)

    let activeId = validBusinessIds[0]
    const storedId = localStorage.getItem('activeBusinessId')

    if (storedId && validBusinessIds.includes(storedId)) {
      activeId = storedId
    }

    localStorage.setItem('activeBusinessId', activeId)

    const { data: business } = await supabase
      .from('businesses')
      .select('trial_end, subscription_active')
      .eq('id', activeId)
      .single()

    if (!business) {
      router.replace('/onboarding')
      return
    }

    const now = new Date()

    if (
      !business.subscription_active &&
      business.trial_end &&
      new Date(business.trial_end) < now
    ) {
      router.replace('/upgrade')
      return
    }

    setLoading(false)
  }

  // 👇 Escuchar cambios de auth
  const { data: listener } = supabase.auth.onAuthStateChange(() => {
    checkAccess()
  })

  checkAccess()

  return () => {
    listener.subscription.unsubscribe()
  }
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