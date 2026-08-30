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
  const BASE_PRODUCT_LIMIT = 2000
  const IMPULSO_PRODUCT_LIMIT = 5000

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null)
  const [newBusinessName, setNewBusinessName] = useState('')
  const [showNewBusinessForm, setShowNewBusinessForm] = useState(false)
  const [openBusinessMenuId, setOpenBusinessMenuId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [planType, setPlanType] = useState<'base' | 'impulso' | 'dominio'>('base')
  const [loadingUpgrade, setLoadingUpgrade] = useState(false)
  const hasImpulsoAccess =
  planType === 'impulso' || planType === 'dominio'
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
  if (!hasImpulsoAccess) {
    setToast('Las sucursales están disponibles en Arcana Impulso')
    return
  }

  localStorage.setItem('activeBusinessId', id)
    setActiveBusinessId(id)
    setToast('Negocio cambiado correctamente')
    setTimeout(() => window.location.reload(), 800)
  }

  const createBusiness = async () => {
  if (!hasImpulsoAccess) {
    setToast('Crear sucursales está disponible en Arcana Impulso')
    return
  }

  if (businesses.length >= 2) {
    setToast('Arcana Impulso permite hasta 2 sucursales')
    return
  }

  if (!newBusinessName.trim()) {
    setToast('Ingresá el nombre de la sucursal')
    return
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return

  const { data, error } = await supabase
    .from('businesses')
    .insert({
  name: newBusinessName,
  owner_id: user.id,
  plan_type: planType,
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
  setShowNewBusinessForm(false)
  fetchBusinesses()
  setToast('Sucursal creada correctamente')
}

 const deleteBusiness = async (id: string) => {
  if (!hasImpulsoAccess) {
    setToast('Administrar sucursales está disponible en Arcana Impulso')
    return
  }

  if (businesses.length <= 1) {
    setToast('Tu cuenta debe conservar al menos un negocio')
    return
  }

  if (id === activeBusinessId) {
    setToast('No podés eliminar la sucursal que está activa')
    return
  }

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
    Configuración
  </h1>

  <p className="text-gray-400 text-sm mt-1">
    {hasImpulsoAccess
      ? 'Administrá tu negocio, sucursales y preferencias.'
      : 'Administrá la información principal de tu negocio.'}
  </p>
</div>

{/* Resumen del plan */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

  {!hasImpulsoAccess ? (
    <>
      {/* Plan Base activo */}
      <div className="bg-[#14141A] border border-blue-500/30 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
              TU PLAN ACTUAL
            </span>

            <h2 className="text-white text-xl font-semibold mt-3">
              Arcana Base
            </h2>

            <p className="text-blue-400 text-sm mt-1">
              Gratis para siempre
            </p>
          </div>

          <div className="h-12 w-12 shrink-0 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center">
            <Store size={26} className="text-blue-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm">
          <div className="flex items-center gap-2 text-gray-200">
            <span className="text-green-400">✓</span>
            Hasta {BASE_PRODUCT_LIMIT.toLocaleString('es-AR')} productos
          </div>

          <div className="flex items-center gap-2 text-gray-200">
            <span className="text-green-400">✓</span>
            Un único negocio
          </div>
        </div>
      </div>

      {/* Invitación a Impulso */}
      <div className="bg-[#14141A] border border-purple-500/30 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
              ¿NECESITÁS MÁS CAPACIDAD?
            </span>

            <h2 className="text-white text-xl font-semibold mt-3">
              Arcana Impulso
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              Sucursales y herramientas avanzadas para crecer.
            </p>
          </div>

          <div className="h-12 w-12 shrink-0 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-center">
            <TrendingUp size={26} className="text-purple-400" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-sm text-gray-200">
          <span>
            Hasta {IMPULSO_PRODUCT_LIMIT.toLocaleString('es-AR')} productos
          </span>

          <span>
            {IMPULSO_PRICE} / mes
          </span>
        </div>

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={loadingUpgrade}
          className="w-full mt-5 rounded-xl bg-purple-600 hover:bg-purple-500 transition px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingUpgrade
            ? 'Conectando con Mercado Pago...'
            : 'Conocer Arcana Impulso'}
        </button>
      </div>
    </>
  ) : (
    /* Plan Impulso activo */
    <div className="lg:col-span-2 bg-[#14141A] border border-purple-500/30 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 shrink-0 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-center">
            <TrendingUp size={26} className="text-purple-400" />
          </div>

          <div>
            <span className="text-green-400 text-xs font-medium">
              PLAN ACTIVO
            </span>

            <h2 className="text-white text-xl font-semibold mt-1">
              Arcana Impulso
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              Hasta {IMPULSO_PRODUCT_LIMIT.toLocaleString('es-AR')} productos
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-medium text-green-400">
          ✓ Suscripción activa
        </div>
      </div>
    </div>
  )}

</div>

      {/* Datos del negocio */}
<div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl overflow-hidden">

  {/* Encabezado */}
  <div className="px-4 py-4 sm:px-5 border-b border-[#1F1F24]">
    <h2 className="text-white text-lg font-semibold">
      Datos del negocio
    </h2>

    <p className="text-gray-400 text-sm mt-1">
      Esta información se utilizará en el sistema y en los comprobantes.
    </p>
  </div>

  <div className="p-4 sm:p-5">
    <div className="grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)] gap-6">

      {/* Logo */}
      <div className="flex flex-col items-center lg:items-start">
        <p className="w-full text-sm font-medium text-gray-300 mb-3">
          Logo del negocio
        </p>

        <div className="h-28 w-28 rounded-2xl border border-[#263247] bg-[#101018] overflow-hidden flex items-center justify-center">
          {businessData.logo_url ? (
            <img
              src={businessData.logo_url}
              alt={`Logo de ${businessData.name || 'tu negocio'}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Store size={42} className="text-gray-600" />
          )}
        </div>

        <input
          id="business-logo"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        <label
          htmlFor="business-logo"
          className="mt-3 cursor-pointer rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition"
        >
          {businessData.logo_url ? 'Cambiar logo' : 'Agregar logo'}
        </label>

        <p className="text-gray-500 text-xs mt-2 text-center lg:text-left">
          JPG o PNG. Recomendado: imagen cuadrada.
        </p>
      </div>

      {/* Formulario */}
      <div className="min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <label className="block min-w-0">
            <span className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del negocio
            </span>

            <input
              type="text"
              value={businessData.name}
              onChange={(e) =>
                setBusinessData({
                  ...businessData,
                  name: e.target.value,
                })
              }
              placeholder="Nombre de tu negocio"
              className="w-full bg-[#101018] border border-[#263247] rounded-xl px-3 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500 transition"
            />
          </label>

          <label className="block min-w-0">
            <span className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </span>

            <input
              type="email"
              value={businessData.email}
              onChange={(e) =>
                setBusinessData({
                  ...businessData,
                  email: e.target.value,
                })
              }
              placeholder="contacto@tunegocio.com"
              className="w-full bg-[#101018] border border-[#263247] rounded-xl px-3 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500 transition"
            />
          </label>

          <label className="block min-w-0">
            <span className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono
            </span>

            <input
              type="tel"
              value={businessData.phone}
              onChange={(e) =>
                setBusinessData({
                  ...businessData,
                  phone: e.target.value,
                })
              }
              placeholder="Número de contacto"
              className="w-full bg-[#101018] border border-[#263247] rounded-xl px-3 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500 transition"
            />
          </label>

          <label className="block min-w-0">
            <span className="block text-sm font-medium text-gray-300 mb-2">
              Dirección
            </span>

            <input
              type="text"
              value={businessData.address}
              onChange={(e) =>
                setBusinessData({
                  ...businessData,
                  address: e.target.value,
                })
              }
              placeholder="Dirección del negocio"
              className="w-full bg-[#101018] border border-[#263247] rounded-xl px-3 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500 transition"
            />
          </label>

        </div>

        <div className="flex justify-end mt-5">
          <button
            type="button"
            onClick={updateBusiness}
            disabled={!activeBusinessId}
            className="w-full sm:w-auto rounded-xl bg-[#1F6BFF] hover:bg-[#2E7BFF] transition px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar cambios
          </button>
        </div>
      </div>

    </div>
  </div>
</div>

{hasImpulsoAccess && (
  <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl overflow-hidden">

    {/* Encabezado */}
    <div className="px-4 py-4 sm:px-5 border-b border-[#1F1F24] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-white text-lg font-semibold">
          Sucursales
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Administrá los puntos de venta asociados a tu cuenta.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowNewBusinessForm((current) => !current)}
        disabled={businesses.length >= 2}
        className="w-full sm:w-auto rounded-xl bg-[#1F6BFF] hover:bg-[#2E7BFF] transition px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {businesses.length >= 2
          ? 'Límite de sucursales alcanzado'
          : showNewBusinessForm
            ? 'Cancelar'
            : '+ Agregar sucursal'}
      </button>
    </div>

    <div className="p-4 sm:p-5 space-y-4">

      {/* Formulario de creación */}
      {showNewBusinessForm && businesses.length < 2 && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
          <label className="block">
            <span className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de la nueva sucursal
            </span>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createBusiness()
                }}
                placeholder="Ejemplo: Sucursal Centro"
                autoFocus
                className="w-full bg-[#101018] border border-[#263247] rounded-xl px-3 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500 transition"
              />

              <button
                type="button"
                onClick={createBusiness}
                disabled={!newBusinessName.trim()}
                className="w-full sm:w-auto shrink-0 rounded-xl bg-[#1F6BFF] hover:bg-[#2E7BFF] transition px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear sucursal
              </button>
            </div>
          </label>
        </div>
      )}

      {/* Listado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {businesses.map((business) => {
          const isActive = business.id === activeBusinessId
          const isMenuOpen = openBusinessMenuId === business.id

          return (
            <div
              key={business.id}
              className={`relative rounded-2xl border p-4 transition ${
                isActive
                  ? 'border-blue-500/40 bg-blue-500/5'
                  : 'border-[#263247] bg-[#101018]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl border border-[#263247] bg-[#172033] flex items-center justify-center">
                  <Store size={22} className="text-blue-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-white font-medium truncate">
                      {business.name}
                    </h3>

                    {isActive && (
                      <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400">
                        Activa
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 text-xs mt-1">
                    {isActive
                      ? 'Sucursal seleccionada actualmente'
                      : 'Sucursal disponible'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpenBusinessMenuId(
                      isMenuOpen ? null : business.id
                    )
                  }
                  className="h-9 w-9 shrink-0 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                  aria-label={`Opciones de ${business.name}`}
                >
                  ⋯
                </button>
              </div>

              {/* Menú de acciones */}
              {isMenuOpen && (
                <div className="absolute right-4 top-14 z-20 w-44 rounded-xl border border-[#263247] bg-[#172033] p-1.5 shadow-2xl">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenBusinessMenuId(null)
                        switchBusiness(business.id)
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-blue-400 hover:bg-blue-500/10 transition"
                    >
                      Activar sucursal
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setOpenBusinessMenuId(null)
                      deleteBusiness(business.id)
                    }}
                    disabled={isActive || businesses.length <= 1}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Eliminar sucursal
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-gray-500 text-xs">
        {businesses.length} de 2 sucursales utilizadas
      </p>
    </div>
  </div>
)}

      {toast && (
        <div className="p-3 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
          {toast}
        </div>
      )}
    </div>
  )
}