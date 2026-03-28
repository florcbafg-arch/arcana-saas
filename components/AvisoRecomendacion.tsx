'use client'

import { useEffect, useState } from 'react'

export default function AvisoRecomendacion() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const visto = localStorage.getItem('aviso_arcana_visto')
    if (!visto) {
      setVisible(true)
    }
  }, [])

  const cerrar = () => {
    localStorage.setItem('aviso_arcana_visto', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="w-full mb-4">
      <div className="bg-[#0B0F1A] border border-[#1f2937] rounded-xl p-3 flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="text-blue-400 text-lg">💡</div>

          <div className="text-sm text-gray-300 leading-tight">
            <span className="font-medium text-white">
              Mejor experiencia recomendada:
            </span>{' '}
            Abrí Arcana desde{' '}
            <span className="text-blue-400 font-medium">Google Chrome</span>{' '}
            o desde tu computadora.
          </div>
        </div>

        <button
          onClick={cerrar}
          className="text-gray-500 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  )
}