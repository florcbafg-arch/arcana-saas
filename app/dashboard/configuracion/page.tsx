'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Store, TrendingUp } from 'lucide-react'

type Business = {
  id: string
  name: string
}

export default function ConfiguracionPage() {

  const IMPULSO_PRICE = 'USD 20'

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null)
  const [newBusinessName, setNewBusinessName] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [planType, setPlanType] = useState<'base' | 'impulso' | 'dominio'>('base')
  const [loadingUpgrade, setLoadingUpgrade] = useState(false)
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
  owner_id: user.id,
  plan_type: 'base',
  subscription_active: true
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
    setPlanType(data.plan_type || 'base')

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

  const fileExt = file.name.split('.').pop()
const filePath = `business-${activeBusinessId}/logo-${Date.now()}.${fileExt}`

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
  const { error: updateError } = await supabase
  .from('businesses')
  .update({ logo_url: publicUrl })
  .eq('id', activeBusinessId)

if (updateError) {
  console.error('ERROR GUARDANDO LOGO EN DB:', updateError)
  alert('La imagen subió, pero no se pudo guardar en el negocio')
  return
}

  setBusinessData((prev) => ({
    ...prev,
    logo_url: publicUrl,
  }))

  alert('Logo actualizado ✅')
}

const handleUpgrade = async () => {
  try {
    setLoadingUpgrade(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Tenés que iniciar sesión.')
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
        business_id: activeBusinessId,
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

    alert('No se pudo iniciar Mercado Pago.')
  } catch (error) {
    console.error(error)
    alert('Error iniciando suscripción.')
  } finally {
    setLoadingUpgrade(false)
  }
}

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold text-white">
          🏢 Gestión de Negocios
        </h1>
        <p className="text-gray-400 text-sm">
          Administrá tus sucursales y negocio activo.
        </p>
      </div>

{/* Planes */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

  {/* Arcana Base */}
  <div className="bg-[#14141A] border border-blue-500/30 rounded-2xl p-6">

    <div className="flex justify-between items-start mb-4">

      <div>
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
          TU PLAN ACTUAL
        </span>

        <h2 className="text-3xl font-bold text-white mt-3">
          Arcana Base
        </h2>

        <p className="text-blue-400 font-medium">
          Gratis para siempre
        </p>
      </div>

      <div className="h-20 w-20 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.25)]">
  <Store size={42} className="text-blue-400" />
</div>

    </div>

    <p className="text-gray-400 mb-6">
      Las herramientas esenciales para vender,
      controlar stock y administrar tu negocio.
    </p>

    <div className="grid grid-cols-2 gap-3 text-sm">

      <div className="text-white">✓ Ventas</div>
      <div className="text-white">✓ Dashboard</div>

      <div className="text-white">✓ Productos</div>
      <div className="text-white">✓ Scanner</div>

      <div className="text-white">✓ Stock</div>
      <div className="text-white">✓ Tickets</div>

      <div className="text-white">✓ 1 Sucursal</div>
      <div className="text-white">✓ 500 Productos</div>

    </div>

  </div>

  {/* Arcana Impulso */}
  <div className="bg-[#14141A] border border-purple-500/30 rounded-2xl p-6">

    <div className="flex justify-between items-start mb-4">

      <div>
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
          MEJORÁ TU PLAN
        </span>

        <h2 className="text-3xl font-bold text-white mt-3">
          Arcana Impulso
        </h2>

     <p className="text-purple-400 font-medium">
  {IMPULSO_PRICE} / mes
</p>

<p className="text-xs text-gray-500 mt-1">
  Cobro equivalente en ARS mediante Mercado Pago.
</p>
      </div>

      <div className="h-20 w-20 rounded-2xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.25)]">
  <TrendingUp size={42} className="text-purple-400" />
</div>
    </div>

    <p className="text-gray-400 mb-6">
      Más control, más organización y más crecimiento
      para tu negocio.
    </p>

    <div className="grid grid-cols-2 gap-3 text-sm mb-6">

      <div className="text-white">✓ Clientes y fiado</div>
      <div className="text-white">✓ Historial completo</div>

      <div className="text-white">✓ Proveedores</div>
      <div className="text-white">✓ Recepción mercadería</div>

      <div className="text-white">✓ Compras inteligentes</div>
      <div className="text-white">✓ Soporte prioritario</div>

      <div className="text-white">✓ 2 Sucursales</div>
      <div className="text-white">✓ 1000 Productos</div>

    </div>

    {planType === 'impulso' ? (
  <div className="w-full rounded-xl border border-green-500/30 bg-green-500/10 py-3 text-center font-medium text-green-400">
    ✅ Arcana Impulso activo
  </div>
) : (
  <button
    onClick={handleUpgrade}
    disabled={loadingUpgrade}
    className="w-full bg-purple-600 hover:bg-purple-500 transition rounded-xl py-3 font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {loadingUpgrade
      ? 'Conectando con Mercado Pago...'
      : '🚀 Actualizar a Arcana Impulso'}
  </button>
)}

  </div>

</div>

      {/* Negocio Activo */}
     <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-4 space-y-5">
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
      className="bg-[#101018] border border-[#1F1F24] rounded-xl px-3 py-2.5 text-white"
    />

    <input
      value={businessData.email}
      onChange={(e) =>
        setBusinessData({ ...businessData, email: e.target.value })
      }
      placeholder="Email"
      className="bg-[#101018] border border-[#1F1F24] rounded-xl px-3 py-2.5 text-white"
    />

    <input
      value={businessData.phone}
      onChange={(e) =>
        setBusinessData({ ...businessData, phone: e.target.value })
      }
      placeholder="Teléfono"
      className="bg-[#101018] border border-[#1F1F24] rounded-xl px-3 py-2.5 text-white"
    />

    <input
      value={businessData.address}
      onChange={(e) =>
        setBusinessData({ ...businessData, address: e.target.value })
      }
      placeholder="Dirección"
      className="bg-[#101018] border border-[#1F1F24] rounded-xl px-3 py-2.5 text-white"
    />
  </div>

  <div className="space-y-3">
    <label className="text-sm text-gray-300">Logo del negocio</label>

{businessData.logo_url && (
  <div className="flex items-center gap-3 bg-[#101018] border border-[#1F1F24] rounded-xl px-3 py-2.5">
    <img
      src={businessData.logo_url}
      alt="Logo del negocio"
      className="h-10 w-10 rounded-full object-cover bg-white p-1"
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
    className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-5 py-2.5 font-medium text-white"
  >
    Guardar cambios
  </button>
</div>

      {/* Lista de negocios */}
      <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-4 space-y-4">
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
      <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-4 space-y-3">
        <h2 className="text-white font-medium">
          Crear nueva sucursal
        </h2>

        <div className="flex gap-3">
          <input
            value={newBusinessName}
            onChange={(e) => setNewBusinessName(e.target.value)}
            placeholder="Nombre de la sucursal"
            className="w-full bg-[#101018] border border-[#1F1F24] rounded-xl px-3 py-2.5 text-white"
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