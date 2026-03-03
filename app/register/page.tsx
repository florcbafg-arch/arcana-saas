'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

 const handleRegister = async () => {
  if (!email || !password) return

  setLoading(true)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error(error.message)
    alert(error.message)
    setLoading(false)
    return
  }

  // 🔒 SI EL USUARIO YA EXISTE
if (data?.user && !data?.session) {
  alert('Este email ya está registrado. Iniciá sesión.')
  setLoading(false)
  return
}

  // 👇 CASO CONFIRM EMAIL ACTIVADO
  if (!data.session) {
    alert('Cuenta creada. Revisa tu correo para verificar tu email.')
    setLoading(false)
    return
  }

  // (Este bloque solo pasaría si confirm email estuviera desactivado)
  window.location.href = '/dashboard'
}

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050510] via-[#0B0B0F] to-[#0A1A3A] text-white px-6">
    <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-10 max-w-md w-full space-y-6">

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">
          Crear cuenta
        </h1>
        <p className="text-gray-400 text-sm">
          Comenzá tu prueba gratuita de 7 días.
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#0F0F14] border border-[#1F1F24] focus:outline-none focus:border-[#1F6BFF]"
        />

        <input
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#0F0F14] border border-[#1F1F24] focus:outline-none focus:border-[#1F6BFF]"
        />

        <button
          onClick={handleRegister}
          disabled={loading}
         className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition rounded-xl py-3 font-medium shadow-lg shadow-blue-500/20"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </div>

<div className="text-center text-sm text-gray-400">
  ¿Ya tenés cuenta?{' '}
  <a href="/login" className="text-blue-400 hover:text-blue-300 transition">
    Iniciar sesión
  </a>
</div>

      <div className="text-center text-xs text-gray-500">
        7 días gratis · Luego 7 USD / mes · Cancelás cuando quieras
      </div>

    </div>
  </div>
)
}