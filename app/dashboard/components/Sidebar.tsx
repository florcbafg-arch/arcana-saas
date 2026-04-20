'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  Settings,
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Productos', href: '/dashboard/productos', icon: Package },
  { name: 'Stock', href: '/dashboard/stock', icon: Boxes },
  { name: 'Ventas', href: '/dashboard/ventas', icon: ShoppingCart },
  { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

export default function Sidebar() {
  const [activeBusinessName, setActiveBusinessName] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const [businesses, setBusinesses] = useState<
  { id: string; name: string }[]
>([])


useEffect(() => {
  const loadBusinesses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setActiveBusinessName('Sin negocio activo')
      return
    }

    // 🔹 Traemos todas las relaciones del usuario
    const { data: relations } = await supabase
      .from('business_users')
      .select('business_id, businesses(name)')
      .eq('user_id', user.id)

    if (!relations || relations.length === 0) {
      localStorage.removeItem('activeBusinessId')
      setActiveBusinessName('Sin negocio activo')
      return
    }

    // 🔹 Armamos array limpio
    const mapped = relations.map((r: any) => ({
      id: r.business_id,
      name: r.businesses?.name ?? 'Sin nombre'
    }))

    setBusinesses(mapped)

    // 🔹 Tomamos el business activo
    let activeId = localStorage.getItem('activeBusinessId') as string | null

    // 🔹 Si no hay activo guardado, usamos el primero
    if (!activeId) {
  activeId = mapped[0].id
  localStorage.setItem('activeBusinessId', activeId!)
}


    // 🔹 Verificamos que el activo exista
    const active = mapped.find(b => b.id === activeId)

    if (active) {
      setActiveBusinessName(active.name)
    } else {
      localStorage.removeItem('activeBusinessId')
      setActiveBusinessName('Sin negocio activo')
    }
  }

  loadBusinesses()
}, [])


  

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('activeBusinessId')
    router.push('/login')
  }

  const handleChangeBusiness = (id: string, name: string) => {
  localStorage.setItem('activeBusinessId', id)
  setActiveBusinessName(name)
  window.location.reload()
}

const reportarProblema = () => {

const pagina = window.location.pathname
const dispositivo = /Mobi|Android/i.test(navigator.userAgent) ? "Móvil" : "Desktop"
const navegador = navigator.userAgent

const fecha = new Date().toLocaleDateString()
const hora = new Date().toLocaleTimeString()

const negocio = localStorage.getItem("activeBusinessId") || "desconocido"

const mensaje = `
Hola Arcana 👋

Quiero reportar un problema.

Negocio ID: ${negocio}
Página: ${pagina}
Dispositivo: ${dispositivo}
Navegador: ${navegador}
Fecha: ${fecha}
Hora: ${hora}

Descripción del problema:
`

const texto = encodeURIComponent(mensaje)

window.open(`https://t.me/arcana_soporte?text=${texto}`, "_blank")

}
  return (
   <aside className="hidden md:flex w-64 min-h-screen bg-[#0E0E11] text-gray-300 border-r border-[#1F1F24] flex-col">

   <div className="px-4 py-8 border-b border-white/5 flex justify-center">
  <div className="relative w-full h-32">
    <Image
      src="/logo-arcana.png"
      alt="Arcana"
      fill
      className="object-contain"
      priority
    />
  </div>
</div>

      <div className="px-5 py-4 border-b border-[#1F1F24]">
  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
    Negocio activo
  </p>

  <p className="mt-2 text-[15px] font-semibold text-white">
    {activeBusinessName || 'Cargando...'}
  </p>

  {businesses.length > 1 && (
    <div className="mt-3 space-y-1.5">
      {businesses.map((b) => (
        <button
          key={b.id}
          onClick={() => handleChangeBusiness(b.id, b.name)}
          className="block w-full rounded-lg px-2 py-1.5 text-left text-[12px] text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          Cambiar a: {b.name}
        </button>
      ))}
    </div>
  )}
</div>


      <nav className="px-3 space-y-1 mt-4">
  {menuItems.map((item) => {
    const isActive = pathname === item.href

    return (
      <Link
        key={item.name}
        href={item.href}
       className={`
  relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200
  ${
    isActive
      ? 'border border-[#6D5EFC]/35 bg-gradient-to-r from-[#4F7CFF]/18 to-[#6D5EFC]/18 text-white shadow-[0_0_24px_rgba(79,124,255,0.10)]'
      : 'text-gray-400 hover:bg-white/5 hover:text-white'
  }
`}
      >
        {/* Barra activa animada */}
        {isActive && (
          <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
        )}

        <item.icon
  size={19}
  strokeWidth={2}
  className={isActive ? 'text-[#7EA2FF]' : 'text-gray-500'}
/>

<span className="text-[15px] font-medium">{item.name}</span>
      </Link>
    )
  })}
</nav>

<button
  onClick={reportarProblema}
  className="mx-3 mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-medium text-gray-300 transition hover:border-[#6D5EFC]/35 hover:bg-[#6D5EFC]/10 hover:text-white"
>
  💬 Reportar problema
</button>

     <button
  onClick={handleLogout}
  className="mx-3 mt-auto mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-medium text-gray-300 transition hover:border-red-400/35 hover:bg-red-500/10 hover:text-white"
>
  🚪 Cerrar sesión
</button>

    </aside>
  )
}

