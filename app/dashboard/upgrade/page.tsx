'use client'

import {
  Users,
  ShoppingCart,
  Truck,
  BarChart3,
  Printer,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

export default function UpgradePage() {

  const features = [
    {
      icon: Users,
      title: 'Clientes y fiado',
      description:
        'Controlá cuentas corrientes, límites y deudas.',
    },

    {
      icon: Truck,
      title: 'Proveedores',
      description:
        'Gestioná proveedores y organizá tus compras.',
    },

    {
      icon: ShoppingCart,
      title: 'Compras inteligentes',
      description:
        'Ingresá mercadería y actualizá stock automáticamente.',
    },

    {
      icon: BarChart3,
      title: 'Reportes y analytics',
      description:
        'Descubrí qué productos venden más y generan más ganancia.',
    },

    {
      icon: Printer,
      title: 'Impresoras y tickets',
      description:
        'Conectá impresoras térmicas y profesionalizá tu negocio.',
    },

    {
      icon: Sparkles,
      title: 'IA futura Arcana',
      description:
        'Funciones inteligentes para ayudarte a vender más.',
    },
  ]

  return (
    <div className="min-h-screen text-white">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1F1F24] bg-[#111117] p-8 md:p-12">

        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#1F6BFF]/20 blur-3xl rounded-full" />

        <div className="relative z-10">

          <div className="inline-flex items-center gap-2 rounded-full border border-[#6D5EFC]/30 bg-[#6D5EFC]/10 px-4 py-2 text-sm text-[#B7A7FF]">
            <ShieldCheck size={16} />
            Arcana PRO
          </div>

          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-tight max-w-3xl">
            Llevá tu negocio al siguiente nivel
          </h1>

          <p className="mt-5 text-gray-400 text-lg max-w-2xl leading-relaxed">
            Arcana PRO incorpora herramientas avanzadas para negocios que necesitan más control, más automatización y más crecimiento.
          </p>

          <button
            className="
              mt-8
              rounded-2xl
              bg-gradient-to-r
              from-[#1F6BFF]
              to-[#6D5EFC]
              px-7
              py-4
              text-lg
              font-bold
              shadow-2xl
              shadow-[#1F6BFF]/20
              transition-all
              hover:scale-[1.02]
            "
          >
            🚀 Activar Arcana PRO
          </button>

        </div>

      </div>

      {/* FEATURES */}
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
              hover:border-[#6D5EFC]/30
              hover:bg-[#14141A]
            "
          >

            <div className="
              w-14
              h-14
              rounded-2xl
              bg-gradient-to-br
              from-[#1F6BFF]/20
              to-[#6D5EFC]/20
              border
              border-[#6D5EFC]/20
              flex
              items-center
              justify-center
            ">
              <feature.icon
                className="text-[#8EA8FF]"
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