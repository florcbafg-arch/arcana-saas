'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
    }
    checkSession()
  }, [router])

 const handleCreateBusiness = async () => {
  if (!businessName.trim()) return
  setLoading(true)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    alert('No hay sesión activa')
    setLoading(false)
    return
  }


  
  // 1️⃣ Crear negocio
  const now = new Date()
const trialEnd = new Date()
trialEnd.setDate(now.getDate() + 7)

const { data: business, error } = await supabase
  .from('businesses')
  .insert({
    name: businessName,
    owner_id: user.id,
    plan_type: 'pro',
    trial_start: now.toISOString(),
    trial_end: trialEnd.toISOString(),
    subscription_active: true
  })
  .select()
  .single()

  if (error || !business) {
    console.error('BUSINESS INSERT ERROR:', error)
    alert(`Error creando el negocio: ${error?.message}`)
    setLoading(false)
    return
  }

  // 2️⃣ Insertar en business_users
  const { error: relationError } = await supabase
    .from('business_users')
    .insert({
      business_id: business.id,
      user_id: user.id,
      role: 'owner'
    })

  if (relationError) {
    console.error('BUSINESS USER ERROR:', relationError)
    alert(`Error asociando usuario: ${relationError.message}`)
    setLoading(false)
    return
  }

  // 3️⃣ Activar negocio
  localStorage.setItem('activeBusinessId', business.id)

  setLoading(false)

  // 4️⃣ Ir al dashboard
  router.push('/dashboard')
}


  return (
  <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-6">

    <div className="w-full max-w-md bg-[#14141A] border border-[#1F1F24] rounded-2xl p-8 space-y-6">

      <div>
        <h1 className="text-2xl font-semibold text-white">
          Bienvenido 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Configurá tu sistema y comenzá a tomar el control.
        </p>
      </div>

      <input
        type="text"
        placeholder="Nombre del negocio"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        className="w-full p-3 rounded-xl bg-[#0F0F14] border border-[#1F1F24] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]"
      />

      <button
        onClick={handleCreateBusiness}
        disabled={!businessName || loading}
        className="w-full bg-[#1F6BFF] hover:bg-blue-500 transition rounded-xl p-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Activando...' : 'Activar mi sistema'}
      </button>

    </div>

  </div>
)
}