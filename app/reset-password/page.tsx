'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!email) return alert('Ingresa tu email')

    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/update-password',
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Te enviamos un correo para restablecer tu contraseña.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white">
      <div className="bg-[#14141A] p-8 rounded-xl w-96">
        <h2 className="text-xl mb-4">Recuperar contraseña</h2>

        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-[#1F1F24] mb-4"
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded"
        >
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </div>
    </div>
  )
}