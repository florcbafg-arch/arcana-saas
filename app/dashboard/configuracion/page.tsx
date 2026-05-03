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
const [businessData, setBusinessData] = useState({
  name: '',
  email: '',
  phone: '',
  address: '',
  logo_url: ''
})

  useEffect(() => {
    const id = localStorage.getItem('activeBusinessId')
    if (id) setActiveBusinessId(id)
    fetchBusinesses()
  }, [])

  useEffect(() => {
  if (!activeBusinessId) return
  fetchBusiness()
}, [activeBusinessId])

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

const fetchBusiness = async () => {
  if (!activeBusinessId) return

  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', activeBusinessId)
    .single()

  if (data) {
    setBusinessData({
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      logo_url: data.logo_url || '',
    })
  }
}

const updateBusiness = async () => {
  const { error } = await supabase
    .from('businesses')
    .update({
      name: businessData.name,
      email: businessData.email,
      phone: businessData.phone,
      address: businessData.address,
      logo_url: businessData.logo_url
    })
    .eq('id', activeBusinessId)

  if (error) {
    alert('Error al guardar')
    return
  }

  alert('Datos actualizados ✅')
}

const handleUpload = async (e: any) => {
  const file = e.target.files[0]
  if (!file || !activeBusinessId) return

  const filePath = `business-${activeBusinessId}`

  // subir imagen
  const { error } = await supabase.storage
    .from('logos')
    .upload(filePath, file, {
      upsert: true,
    })

  if (error) {
    alert('Error subiendo imagen')
    return
  }

  // obtener URL pública
  const { data } = supabase.storage
    .from('logos')
    .getPublicUrl(filePath)

  const publicUrl = data.publicUrl

  // guardar en DB
  await supabase
    .from('businesses')
    .update({ logo_url: publicUrl })
    .eq('id', activeBusinessId)

  setBusinessData((prev) => ({
    ...prev,
    logo_url: publicUrl,
  }))

  alert('Logo actualizado ✅')
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
     <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6 space-y-5">
  <div>
    <h2 className="text-white font-medium">Negocio activo</h2>
    <p className="text-gray-400 text-sm">
      Datos que se usarán en tickets, mensajes y configuración del sistema.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input
      value={businessData.name}
      onChange={(e) =>
        setBusinessData({ ...businessData, name: e.target.value })
      }
      placeholder="Nombre del negocio"
      className="bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
    />

    <input
      value={businessData.email}
      onChange={(e) =>
        setBusinessData({ ...businessData, email: e.target.value })
      }
      placeholder="Email"
      className="bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
    />

    <input
      value={businessData.phone}
      onChange={(e) =>
        setBusinessData({ ...businessData, phone: e.target.value })
      }
      placeholder="Teléfono"
      className="bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
    />

    <input
      value={businessData.address}
      onChange={(e) =>
        setBusinessData({ ...businessData, address: e.target.value })
      }
      placeholder="Dirección"
      className="bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
    />
  </div>

  <div className="space-y-3">
    <label className="text-sm text-gray-300">Logo del negocio</label>

{businessData.logo_url && (
  <div className="flex items-center gap-3 bg-[#101018] border border-[#1F1F24] rounded-xl p-3">
    <img
      src={businessData.logo_url}
      alt="Logo del negocio"
      className="h-12 w-12 rounded-full object-cover bg-white p-1"
    />

    <div>
      <p className="text-white text-sm font-medium">Logo cargado</p>
      <p className="text-gray-400 text-xs">
        Se usará en tickets y personalización del negocio.
      </p>
    </div>
  </div>
)}

<p className="text-xs text-gray-500">
  Recomendado: logo simple, fondo blanco o transparente.
</p>

    <input
      type="file"
      accept="image/*"
      onChange={handleUpload}
      className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-[#1F6BFF] file:px-4 file:py-2 file:text-white hover:file:bg-[#2E7BFF]"
    />

  </div>

  <button
    onClick={updateBusiness}
    className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-6 py-3 font-medium text-white"
  >
    Guardar cambios
  </button>
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