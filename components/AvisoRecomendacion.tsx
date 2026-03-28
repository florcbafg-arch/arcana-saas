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
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
    <div className="bg-[#0B0F1A] border border-[#1f2937] rounded-xl px-3 py-2 flex items-center justify-between gap-3shadow-lg backdrop-blur-sm ">

      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
        <span className="text-blue-400">💡</span>
        <span>
          Mejor experiencia: usar en{" "}
          <span className="text-blue-400 font-medium">Chrome</span>
        </span>
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