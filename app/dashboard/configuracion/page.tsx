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
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
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

useEffect(() => {
  if (!isPlanModalOpen) return

  const previousOverflow = document.body.style.overflow

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsPlanModalOpen(false)
    }
  }

  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeyDown)

  return () => {
    document.body.style.overflow = previousOverflow
    window.removeEventListener('keydown', handleKeyDown)
  }
}, [isPlanModalOpen])

useEffect(() => {
  if (!toast) return

  const timeoutId = window.setTimeout(() => {
    setToast(null)
  }, 3500)

  return () => {
    window.clearTimeout(timeoutId)
  }
}, [toast])

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
  console.error('Error actualizando negocio:', error)
  setToast('Error al guardar los datos del negocio')
  return
}

setToast('Datos del negocio guardados correctamente')
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
  console.error('Error subiendo logo:', error)
  setToast('Error al subir el logo del negocio')
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
  console.error('Error guardando logo en el negocio:', updateError)
  setToast('El logo subió, pero no se pudo guardar en el negocio')
  return
}

  setBusinessData((prev) => ({
    ...prev,
    logo_url: publicUrl,
  }))

  setToast('Logo del negocio actualizado correctamente')
}

const handleUpgrade = async () => {
  try {
    setLoadingUpgrade(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
  setToast('Tenés que iniciar sesión para contratar Arcana Impulso')
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

    setToast('No se pudo iniciar el checkout de Mercado Pago')
  } catch (error) {
    console.error(error)
    setToast('Error al iniciar la suscripción de Arcana Impulso')
  } finally {
    setLoadingUpgrade(false)
  }
}

const toastIsError = Boolean(
  toast &&
    /error|no se pudo|no podés|tenés que|límite|disponible|ingresá|debe conservar/i.test(
      toast
    )
)

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
<div className="grid grid-cols-1 lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.55fr)] items-start gap-4">

  {!hasImpulsoAccess ? (
    <>
      {/* Plan Base activo */}
      <div className="self-start bg-[#14141A] border border-blue-500/30 rounded-2xl p-4 sm:p-5">
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
      <div className="self-start bg-[#14141A] border border-purple-500/30 rounded-2xl p-4 sm:p-5">
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

<div className="flex flex-wrap gap-2 mt-4">
  {[
    'Sucursales',
    'Clientes y fiado',
    'Compras inteligentes',
  ].map((benefit) => (
    <span
      key={benefit}
      className="rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs text-purple-200"
    >
      {benefit}
    </span>
  ))}
</div>

     <button
  type="button"
  onClick={() => setIsPlanModalOpen(true)}
  className="group w-full mt-5 rounded-xl border border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 transition px-4 py-3 text-sm font-semibold text-purple-300 flex items-center justify-between"
>
  <span>Ver todos los beneficios</span>

  <span
    aria-hidden="true"
    className="h-8 w-8 rounded-full border border-purple-500/40 flex items-center justify-center text-lg transition-transform group-hover:translate-x-1"
  >
    →
  </span>
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

{/* Modal de comparación de planes */}
{isPlanModalOpen && !hasImpulsoAccess && (
  <div
    className="fixed inset-0 z-[1200] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
    onClick={() => setIsPlanModalOpen(false)}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
      onClick={(event) => event.stopPropagation()}
      className="w-full sm:max-w-4xl max-h-[95vh] bg-[#111827] border border-[#263247] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Encabezado */}
      <div className="shrink-0 flex items-start justify-between gap-4 px-4 py-4 sm:px-6 border-b border-[#263247]">
        <div>
          <span className="inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            COMPARÁ LOS PLANES
          </span>

          <h2
            id="plan-modal-title"
            className="text-white text-xl sm:text-2xl font-semibold mt-3"
          >
            Llevá tu negocio al siguiente nivel
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Elegí las herramientas que necesitás para seguir creciendo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPlanModalOpen(false)}
          className="h-10 w-10 shrink-0 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
          aria-label="Cerrar comparación de planes"
        >
          ✕
        </button>
      </div>

      {/* Contenido con scroll interno */}
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
            <span className="text-blue-400 text-xs font-medium">
              PLAN ACTUAL
            </span>

            <h3 className="text-white text-lg font-semibold mt-2">
              Arcana Base
            </h3>

            <p className="text-gray-400 text-sm mt-1">
              Gratis para siempre
            </p>

            <p className="text-white text-sm mt-4">
              Hasta {BASE_PRODUCT_LIMIT.toLocaleString('es-AR')} productos
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/40 bg-purple-500/5 p-4">
            <span className="text-purple-300 text-xs font-medium">
              MÁS CAPACIDAD Y CONTROL
            </span>

            <h3 className="text-white text-lg font-semibold mt-2">
              Arcana Impulso
            </h3>

            <p className="text-purple-300 font-semibold mt-1">
              {IMPULSO_PRICE} / mes
            </p>

            <p className="text-white text-sm mt-4">
              Hasta {IMPULSO_PRODUCT_LIMIT.toLocaleString('es-AR')} productos
            </p>
          </div>
        </div>

        {/* Comparación */}
        <div className="mt-5 rounded-2xl border border-[#263247] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-[#172033]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Característica
                  </th>

                  <th className="px-4 py-3 text-left font-medium text-blue-400">
                    Arcana Base
                  </th>

                  <th className="px-4 py-3 text-left font-medium text-purple-300">
                    Arcana Impulso
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#263247]">
                {[
                  [
                    'Productos',
                    BASE_PRODUCT_LIMIT.toLocaleString('es-AR'),
                    IMPULSO_PRODUCT_LIMIT.toLocaleString('es-AR'),
                  ],
                  ['Negocio', '1 negocio', 'Hasta 2 sucursales'],
                  ['Clientes y fiado', '—', 'Incluido'],
                  ['Proveedores', '—', 'Incluido'],
                  ['Compras inteligentes', '—', 'Incluido'],
                  ['Tickets', 'Estándar', 'Personalizables'],
                  ['Alertas configurables', '—', 'Incluidas'],
                  ['Usuarios y permisos', '—', 'Incluidos'],
                  ['Historial', 'Esencial', 'Completo'],
                  ['Soporte', 'Estándar', 'Prioritario'],
                ].map(([feature, base, impulso]) => (
                  <tr key={feature} className="bg-[#111827]">
                    <td className="px-4 py-3 text-gray-300">
                      {feature}
                    </td>

                    <td className="px-4 py-3 text-gray-400">
                      {base}
                    </td>

                    <td className="px-4 py-3 font-medium text-purple-200">
                      {impulso}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Beneficios destacados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {[
            {
              title: 'Más capacidad',
              description:
                'Ampliá tu catálogo y administrá más productos.',
            },
            {
              title: 'Más control',
              description:
                'Gestioná sucursales, clientes, compras y alertas.',
            },
            {
              title: 'Más crecimiento',
              description:
                'Accedé a herramientas avanzadas para decidir mejor.',
            },
          ].map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-2xl border border-[#263247] bg-[#172033]/60 p-4"
            >
              <h4 className="text-white text-sm font-semibold">
                {benefit.title}
              </h4>

              <p className="text-gray-400 text-xs leading-relaxed mt-2">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Checkout */}
        <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-white text-lg font-semibold">
                Arcana Impulso · {IMPULSO_PRICE} / mes
              </p>

              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Cobro equivalente en pesos argentinos mediante Mercado Pago.
              </p>

              <p className="text-gray-500 text-xs mt-1">
                Podés cancelar cuando quieras.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loadingUpgrade}
              className="w-full sm:w-auto shrink-0 rounded-xl bg-purple-600 hover:bg-purple-500 transition px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingUpgrade
                ? 'Conectando con Mercado Pago...'
                : 'Actualizar a Arcana Impulso →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
)}

  {toast && (
  <div
    role={toastIsError ? 'alert' : 'status'}
    aria-live={toastIsError ? 'assertive' : 'polite'}
    className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:w-full sm:max-w-sm z-[1400] rounded-2xl backdrop-blur-md shadow-2xl p-4 border ${
      toastIsError
        ? 'border-red-500/30 bg-[#1A1116]/95'
        : 'border-green-500/30 bg-[#101A17]/95'
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center font-semibold ${
          toastIsError
            ? 'bg-red-500/10 text-red-400'
            : 'bg-green-500/10 text-green-400'
        }`}
      >
        {toastIsError ? '!' : '✓'}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium">
          {toastIsError
            ? 'No pudimos completar la acción'
            : 'Todo listo'}
        </p>

        <p className="text-gray-400 text-xs mt-1">
          {toast}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setToast(null)}
        className="h-8 w-8 shrink-0 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
        aria-label="Cerrar mensaje"
      >
        ✕
      </button>
    </div>
  </div>
)}
    </div>
  )
}