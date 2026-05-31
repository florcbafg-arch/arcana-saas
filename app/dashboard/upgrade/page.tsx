'use client'

import {
  Users,
  ShoppingCart,
  Truck,
  BarChart3,
  Package,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UpgradePage() {

  const IMPULSO_PRICE = 'USD 20'

  const [loading, setLoading] = useState(false)

const handleUpgrade = async () => {
  try {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Tenés que iniciar sesión para actualizar tu plan.')
      return
    }

    const res = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        user_id: user.id,
      }),
    })

    const data = await res.json()

    if (data.init_point) {
      window.location.href = data.init_point
      return
    }

    if (data.sandbox_init_point) {
      window.location.href = data.sandbox_init_point
      return
    }

    console.error('Respuesta Mercado Pago:', data)
    alert('No se pudo iniciar el pago. Revisá la consola.')

  } catch (error) {
    console.error(error)
    alert('Error iniciando Mercado Pago.')
  } finally {
    setLoading(false)
  }
}

  const features = [
    {
      icon: Users,
      title: 'Clientes y fiado',
      description: 'Controlá cuentas corrientes, límites de crédito, deudas y pagos pendientes.',
    },
    {
      icon: Truck,
      title: 'Proveedores',
      description: 'Centralizá contactos, teléfonos y datos clave de cada proveedor.',
    },
    {
      icon: ShoppingCart,
      title: 'Compras inteligentes',
      description: 'Ingresá mercadería, registrá costos y actualizá stock automáticamente.',
    },
    {
      icon: BarChart3,
      title: 'Historial completo',
      description: 'Consultá movimientos, compras, ventas y decisiones importantes del negocio.',
    },
    {
      icon: Building2,
      title: '2 sucursales',
      description: 'Gestioná hasta dos negocios o puntos de venta desde una misma cuenta.',
    },
    {
      icon: Package,
      title: '1000 productos',
      description: 'Cargá más inventario y escalá tu operación con más capacidad.',
    },
  ]

  return (
    <div className="min-h-screen text-white">

      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-[#111117] p-8 md:p-12">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#1F6BFF]/10 blur-3xl rounded-full" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
            <ShieldCheck size={16} />
            ARCANA IMPULSO
          </div>

          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-tight max-w-3xl">
            Más control para hacer crecer tu negocio
          </h1>

          <p className="mt-5 text-gray-400 text-lg max-w-2xl leading-relaxed">
            Desbloqueá clientes, proveedores, compras inteligentes y más capacidad para administrar tu negocio con claridad.
          </p>

          <div className="mt-6">
  <p className="text-3xl font-extrabold text-white">
  {IMPULSO_PRICE}
  <span className="text-base font-medium text-gray-400"> / mes</span>
</p>

<p className="text-sm text-gray-500 mt-1">
  Cobro equivalente en ARS mediante Mercado Pago.
</p>
            <p className="text-sm text-gray-500 mt-1">
              Podés cancelar cuando quieras.
            </p>
          </div>

          <button
  onClick={handleUpgrade}
  disabled={loading}
  className="
              mt-8
              rounded-2xl
              bg-gradient-to-r
              from-purple-600
              to-[#1F6BFF]
              px-7
              py-4
              text-lg
              font-bold
              shadow-2xl
              shadow-purple-500/20
              transition-all
              hover:scale-[1.02]
            "
          >
            {loading ? 'Conectando con Mercado Pago...' : '🚀 Actualizar a Arcana Impulso'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="
              rounded-3xl
              border
              border-[#1F1F24]
              bg-[#111117]
              p-6
              transition-all
              hover:border-purple-500/40
              hover:bg-[#14141A]
            "
          >
            <div className="
              w-14
              h-14
              rounded-2xl
              bg-gradient-to-br
              from-purple-500/20
              to-[#1F6BFF]/20
              border
              border-purple-500/20
              flex
              items-center
              justify-center
            ">
              <feature.icon
                className="text-purple-300"
                size={26}
              />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {feature.title}
            </h2>

            <p className="mt-3 text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}