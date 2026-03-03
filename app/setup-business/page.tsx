'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SetupBusinessPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
      }
    }
    checkSession()
  }, [router])

  const createBusiness = async () => {
    if (!name.trim()) {
      alert('Ingresá un nombre para el negocio')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Usuario no autenticado')
      setLoading(false)
      return
    }

    // 1️⃣ Crear negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({ name })
      .select()
      .single()

    if (businessError) {
      console.error(businessError)
      alert('Error creando el negocio')
      setLoading(false)
      return
    }

    // 2️⃣ Vincular usuario ↔ negocio
    const { error: linkError } = await supabase
      .from('business_users')
      .insert({
        business_id: business.id,
        user_id: user.id,
        role: 'owner',
      })

    if (linkError) {
      console.error(linkError)
      alert('Error asignando usuario al negocio')
      setLoading(false)
      return
    }

    // 3️⃣ Redirect final
    router.push('/dashboard') // o /app, lo vemos después
  }

  return (
    <main style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <h1>Crear tu negocio</h1>
      <p>Antes de empezar, configurá tu negocio</p>

      <input
        type="text"
        placeholder="Nombre del negocio"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        style={{ width: '100%', padding: 8 }}
      />

      <br /><br />

      <button
        onClick={createBusiness}
        disabled={loading}
        style={{ width: '100%', padding: 10 }}
      >
        {loading ? 'Creando...' : 'Crear negocio'}
      </button>
    </main>
  )
}

