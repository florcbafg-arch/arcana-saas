'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock } from 'lucide-react'
import AvisoRecomendacion from '../../components/AvisoRecomendacion'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Completa todos los campos')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('Credenciales inválidas')
      return
    }

    router.push('/dashboard')
  }

  return (
  <div className="relative min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white overflow-hidden px-4">

    {/* Glow ambiental */}
    <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl top-[-200px] right-[-150px]" />
    <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl bottom-[-200px] left-[-150px]" />

    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-full max-w-md bg-[#14141A]/90 backdrop-blur-xl border border-[#1F1F24] rounded-2xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
    >

      {/* Branding */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-wide bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Arcana
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Inteligencia para tu negocio
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-500/30 p-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Email */}
      <div className="relative mb-4 group">
        <Mail className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-500 transition" size={18} />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 p-3 rounded-lg bg-[#1F1F24] border border-[#2A2A32] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
        />
      </div>

      {/* Password */}
      <div className="relative mb-2 group">
        <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-500 transition" size={18} />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 p-3 rounded-lg bg-[#1F1F24] border border-[#2A2A32] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
        />
      </div>

      <div className="text-right mb-6">
        <button
          onClick={() => router.push('/reset-password')}
          className="text-sm text-blue-400 hover:text-blue-300 transition"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Button */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 active:scale-[0.98] transition-all duration-200 p-3 rounded-lg font-medium flex items-center justify-center shadow-lg shadow-blue-600/20"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Ingresar'
        )}
      </button>

      <div className="text-center mt-6 text-sm text-gray-400">
        ¿No tienes cuenta?{' '}
        <span
          onClick={() => router.push('/register')}
          className="text-blue-400 hover:text-blue-300 cursor-pointer transition"
        >
          Crear cuenta
        </span>
      </div>

    </motion.div>
  </div>
)
}