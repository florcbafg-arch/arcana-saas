'use client'

import Link from 'next/link'
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

const mensaje = `
Hola Arcana 👋

Quiero reportar un problema.

Página: ${pagina}
Dispositivo: ${dispositivo}

Descripción del problema:
`

const texto = encodeURIComponent(mensaje)

window.open(`https://t.me/arcana_soporte?text=${texto}`, "_blank")

}

  return (
    <aside className="w-64 min-h-screen bg-[#0E0E11] text-gray-300 border-r border-[#1F1F24] flex flex-col">

      <div className="px-6 py-5 text-xl font-semibold text-white">
        Arcana
      </div>

      <div className="px-6 pb-4 border-b border-[#1F1F24]">
  <p className="text-xs text-gray-500 uppercase tracking-wide">
    Negocio activo
  </p>

  <p className="text-sm font-semibold text-white mt-1">
    {activeBusinessName || 'Cargando...'}
  </p>

  {businesses.length > 1 && (
    <div className="mt-3 space-y-1">
      {businesses.map((b) => (
        <button
          key={b.id}
          onClick={() => handleChangeBusiness(b.id, b.name)}
          className="text-xs text-gray-400 hover:text-white block text-left w-full"
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
          relative flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
          ${
            isActive
              ? 'bg-gradient-to-r from-blue-600/20 to-indigo-500/20 border border-blue-500/30 text-white shadow-md shadow-blue-600/10'
              : 'text-gray-400 hover:text-white hover:bg-[#1A1A22]'
          }
        `}
      >
        {/* Barra activa animada */}
        {isActive && (
          <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
        )}

        <item.icon
          size={18}
          className={isActive ? 'text-blue-400' : 'text-gray-500'}
        />

        <span className="text-sm font-medium">{item.name}</span>
      </Link>
    )
  })}
</nav>

<button
  onClick={reportarProblema}
  className="mt-4 bg-[#0F0F14] border border-[#1F1F24] text-gray-400 hover:text-white hover:border-blue-500 transition rounded-xl p-3"
>
  💬 Reportar problema
</button>

      <button
        onClick={handleLogout}
        className="mt-auto bg-[#0F0F14] border border-[#1F1F24] text-gray-400 hover:text-white hover:border-red-500 transition rounded-xl p-3"
      >
        🚪 Cerrar sesión
      </button>

    </aside>
  )
}

