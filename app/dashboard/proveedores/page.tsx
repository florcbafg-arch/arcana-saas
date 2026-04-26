'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Truck, Plus, Search, Phone, Mail, MapPin, Trash2 } from 'lucide-react'

type Supplier = {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchSuppliers = async () => {
  const activeBusinessId = localStorage.getItem('activeBusinessId')

  if (!activeBusinessId) return

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('business_id', activeBusinessId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error cargando proveedores:', error)
    return
  }

  setSuppliers(data || [])
}

  const createSupplier = async () => {
  const activeBusinessId = localStorage.getItem('activeBusinessId')

 if (!activeBusinessId) {
  setToast({ type: 'error', message: 'No hay negocio activo' })
  return
}

if (!name.trim()) {
  setToast({ type: 'error', message: 'El nombre es obligatorio' })
  return
}

 let error

if (editingId) {
  const result = await supabase
    .from('suppliers')
    .update({
      name,
      phone,
      email,
      address,
    })
    .eq('id', editingId)

  error = result.error
} else {
  const result = await supabase.from('suppliers').insert([
    {
      name,
      phone,
      email,
      address,
      business_id: activeBusinessId,
    },
  ])

  error = result.error
}
  if (error) {
  console.error('Error creando proveedor:', error)
  setToast({ type: 'error', message: 'No se pudo crear el proveedor' })
  return
}

setToast({
  type: 'success',
  message: editingId ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente',
})

setEditingId(null)
setIsOpen(false)

  setName('')
  setPhone('')
  setEmail('')
  setAddress('')

  fetchSuppliers()
}

const handleEdit = (supplier: Supplier) => {
  setEditingId(supplier.id)
  setName(supplier.name || '')
  setPhone(supplier.phone || '')
  setEmail(supplier.email || '')
  setAddress(supplier.address || '')
  setIsOpen(true)
}

const handleDelete = async (id: string) => {
  if (!confirm('¿Eliminar proveedor?')) return

  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando proveedor:', error)
    setToast({ type: 'error', message: 'No se pudo eliminar el proveedor' })
    return
  }

  setToast({ type: 'success', message: 'Proveedor eliminado correctamente' })
  fetchSuppliers()
}

  useEffect(() => {
    fetchSuppliers()
  }, [])

  useEffect(() => {
  if (!toast) return

  const timer = setTimeout(() => {
    setToast(null)
  }, 2500)

  return () => clearTimeout(timer)
}, [toast])

  return (
    <div style={{ padding: 20 }}>
{toast && (
  <div
    className={`mb-4 p-4 rounded-xl text-sm font-medium ${
      toast.type === 'success'
        ? 'bg-green-900 text-green-400 border border-green-700'
        : 'bg-red-900 text-red-400 border border-red-700'
    }`}
  >
    {toast.message}
  </div>
)}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>

  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
  <div className="text-5xl drop-shadow-[0_0_18px_rgba(59,130,246,0.75)]">
  🚚
</div>
    <div>
      <h1 style={{ margin: 0 }}>Proveedores</h1>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
        Gestioná tus compras y proveedores
      </p>
    </div>
  </div>

  <button
  onClick={() => setIsOpen(true)}
  className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-5 py-3 font-semibold flex items-center gap-2"
>
  ➕ Nuevo proveedor
</button>
</div>

      {isOpen && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: 16
  }}>
    <div style={{
      background: '#14141A',
      border: '1px solid #1F1F24',
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 420
    }}>
      <h2 style={{ color: 'white', marginBottom: 20 }}>
  {editingId ? 'Editar proveedor' : 'Nuevo proveedor'}
</h2>

     <div className="space-y-4">

  <div className="space-y-1">
    <label className="text-sm text-gray-400">Nombre del proveedor</label>
    <input
      placeholder="Ej: Textiles del Centro"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
    />
  </div>

  <div className="space-y-1">
    <label className="text-sm text-gray-400">Teléfono</label>
    <input
      placeholder="Ej: 0354 941 8987"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
    />
  </div>

  <div className="space-y-1">
    <label className="text-sm text-gray-400">Email</label>
    <input
      placeholder="Ej: proveedor@email.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
    />
  </div>

  <div className="space-y-1">
    <label className="text-sm text-gray-400">Dirección</label>
    <input
      placeholder="Ej: Córdoba, Argentina"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
    />
  </div>

</div>

     <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
  <button
    onClick={() => {
      setIsOpen(false)
      setEditingId(null)
    }}
    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#2A2A32] bg-[#1A1A22] text-white hover:bg-[#22222B] hover:border-[#3A3A48] transition"
  >
    Cancelar
  </button>

  <button
    onClick={createSupplier}
    className="w-full sm:w-auto bg-[#1F6BFF] hover:bg-[#2E7BFF] transition px-5 py-2 rounded-xl font-semibold text-white"
  >
    Guardar
  </button>
</div>
    </div>
  </div>
)}

      <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl overflow-hidden mt-6">
  <div className="max-h-[520px] overflow-y-auto">

  <div className="divide-y divide-[#1F1F24]">
    {suppliers.map((s) => (
      <div
        key={s.id}
        className="flex items-center justify-between px-5 py-4 hover:bg-[#101018] transition"
      >

        {/* INFO */}
        <div className="space-y-1">
          <p className="text-white font-medium">
            {s.name}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400">

            {s.phone && (
              <span className="flex items-center gap-1">
                <Phone size={14} /> {s.phone}
              </span>
            )}

            {s.email && (
              <span className="flex items-center gap-1">
                <Mail size={14} /> {s.email}
              </span>
            )}

            {s.address && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {s.address}
              </span>
            )}

          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex gap-3">

          <button
            onClick={() => handleEdit(s)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ✏️ Editar
          </button>

          <button
            onClick={() => handleDelete(s.id)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            🗑 Eliminar
          </button>

        </div>

      </div>
    ))}
</div>
  </div>

  {suppliers.length === 0 && (
    <div className="p-6 text-center text-gray-500">
      No hay proveedores cargados
    </div>
  )}

</div>
    </div>
  )
}