'use client'

import { useRouter } from 'next/navigation'

export default function UpgradePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white px-6">
      <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-10 max-w-md w-full text-center space-y-6">

        <h1 className="text-2xl font-semibold">
          Tu prueba terminó
        </h1>

        <p className="text-gray-400 text-sm">
          Tu período gratuito de 7 días finalizó.
          Activá tu plan para seguir usando Arcana sin interrupciones.
        </p>

        <div className="bg-[#0F0F14] border border-[#1F1F24] rounded-xl p-4">
          <p className="text-lg font-medium">
            Arcana Pro
          </p>
          <p className="text-yellow-400 text-2xl font-bold mt-2">
            7 USD / mes
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Se cobra en pesos al tipo de cambio del día.
          </p>
        </div>

        <button
          className="w-full bg-[#1F6BFF] hover:bg-blue-600 transition rounded-xl py-3 font-medium"
        >
          Activar suscripción
        </button>

        <button
          onClick={() => router.push('/login')}
          className="text-gray-500 text-xs hover:text-gray-300 transition"
        >
          Cerrar sesión
        </button>

      </div>
    </div>
  )
}