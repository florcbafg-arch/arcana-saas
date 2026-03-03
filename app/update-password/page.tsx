'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async () => {
    if (password.length < 6)
      return alert('Mínimo 6 caracteres')

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Contraseña actualizada')
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white">
      <div className="bg-[#14141A] p-8 rounded-xl w-96">
        <h2 className="text-xl mb-4">Nueva contraseña</h2>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-[#1F1F24] mb-4"
        />

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded"
        >
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </div>
    </div>
  )
}