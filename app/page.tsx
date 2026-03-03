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
 
      const { data: businesses, error } = await supabase
  .from('business_users')
  .select('business_id')
  .eq('user_id', user.id)

if (error || !businesses || businesses.length === 0) {
  router.push('/onboarding')
  return
}

// usar el primero como default
const firstBusinessId = businesses[0].business_id

localStorage.setItem('activeBusinessId', firstBusinessId)

     router.push('/dashboard')

    }

    checkBusiness()
  }, [router])

  return <p style={{ padding: 40 }}>Cargando sistema…</p>
}
