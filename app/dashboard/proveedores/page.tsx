'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    alert('No hay negocio activo')
    return
  }

  if (!name.trim()) {
    alert('El nombre del proveedor es obligatorio')
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
    alert('No se pudo crear el proveedor')
    return
  }

  setName('')
  setPhone('')
  setEmail('')
  setAddress('')

  fetchSuppliers()
}

  useEffect(() => {
    fetchSuppliers()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Proveedores</h1>

      <div style={{ marginBottom: 20 }}>
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />
        <button onClick={createSupplier}>Crear</button>
      </div>

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