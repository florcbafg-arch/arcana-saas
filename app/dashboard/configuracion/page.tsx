'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Business = {
  id: string
  name: string
}

export default function ConfiguracionPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null)
  const [newBusinessName, setNewBusinessName] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('activeBusinessId')
    if (id) setActiveBusinessId(id)
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })

    setBusinesses(data || [])
  }

  const switchBusiness = (id: string) => {
    localStorage.setItem('activeBusinessId', id)
    setActiveBusinessId(id)
    setToast('Negocio cambiado correctamente')
    setTimeout(() => window.location.reload(), 800)
  }

  const createBusiness = async () => {
  if (!newBusinessName.trim()) return

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      name: newBusinessName,
      owner_id: user.id
    })
    .select()
    .single()

  if (error) {
    setToast('Error creando negocio')
    return
  }

  localStorage.setItem('activeBusinessId', data.id)
  setActiveBusinessId(data.id)
  setNewBusinessName('')
  fetchBusinesses()
  setToast('Sucursal creada correctamente')
}

 const deleteBusiness = async (id: string) => {
  const confirmDelete = confirm(
    '¿Eliminar negocio? Se borrará todo su contenido.'
  )
  if (!confirmDelete) return

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    setToast('Error eliminando negocio')
    return
  }

  if (activeBusinessId === id) {
    localStorage.removeItem('activeBusinessId')
  }

  fetchBusinesses()
  setToast('Negocio eliminado correctamente')
}

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-semibold text-white">
          🏢 Gestión de Negocios
        </h1>
        <p className="text-gray-400 text-sm">
          Administrá tus sucursales y negocio activo.
        </p>
      </div>

      {/* Negocio Activo */}
      <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6">
        <h2 className="text-white font-medium mb-4">
          Negocio activo
        </h2>

        {businesses
          .filter(b => b.id === activeBusinessId)
          .map(b => (
            <div
              key={b.id}
              className="px-4 py-3 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30"
            >
              {b.name}
            </div>
          ))}
      </div>

      {/* Lista de negocios */}
      <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-medium">
          Mis negocios
        </h2>

        {businesses.map(b => (
          <div
            key={b.id}
            className="flex justify-between items-center bg-[#101018] rounded-xl p-4"
          >
            <span className="text-white">{b.name}</span>

            <div className="flex gap-3">

              {b.id !== activeBusinessId && (
                <button
                  onClick={() => switchBusiness(b.id)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Activar
                </button>
              )}

              <button
                onClick={() => deleteBusiness(b.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Crear nueva sucursal */}
      <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-medium">
          Crear nueva sucursal
        </h2>

        <div className="flex gap-3">
          <input
            value={newBusinessName}
            onChange={(e) => setNewBusinessName(e.target.value)}
            placeholder="Nombre de la sucursal"
            className="w-full bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
          />

          <button
            onClick={createBusiness}
            className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-6"
          >
            Crear
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
          {toast}
        </div>
      )}
    </div>
  )
}