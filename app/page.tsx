'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    const checkBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }
 
      const { data } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle()


      if (!data) {
        router.push('/onboarding')
        return
      }

      localStorage.setItem('activeBusinessId', data.business_id)

     router.push('/dashboard')

    }

    checkBusiness()
  }, [router])

  return <p style={{ padding: 40 }}>Cargando sistema…</p>
}
