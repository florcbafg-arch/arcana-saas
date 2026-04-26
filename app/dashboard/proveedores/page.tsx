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

  const { error } = await supabase.from('suppliers').insert([
    {
      name,
      phone,
      email,
      address,
      business_id: activeBusinessId,
    },
  ])

  if (error) {
  console.error('Error creando proveedor:', error)
  setToast({ type: 'error', message: 'No se pudo crear el proveedor' })
  return
}

setToast({ type: 'success', message: 'Proveedor creado correctamente' })
setIsOpen(false)

  setName('')
  setPhone('')
  setEmail('')
  setAddress('')

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
  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-blue-400/30 flex items-center justify-center shadow-[0_0_28px_rgba(79,124,255,0.25)]">
    <Truck size={32} className="text-blue-300" />
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
        Nuevo proveedor
      </h2>

      <div style={{ display: 'grid', gap: 12 }}>
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button onClick={() => setIsOpen(false)}>
          Cancelar
        </button>

        <button onClick={createSupplier}>
          Guardar
        </button>
      </div>
    </div>
  </div>
)}

      <ul>
        {suppliers.map((s) => (
          <li key={s.id}>
            {s.name} - {s.phone} - {s.email}
          </li>
        ))}
      </ul>
    </div>
  )
}