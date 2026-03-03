'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Customer = {
  id: string
  name: string
  business_id: string
  debt_amount: number
  credit_limit?: number

}

type Movement = {
  id: string
  customer_id: string
  type: 'add' | 'pay'
  amount: number
  created_at: string
}



export default function ClientesPage() {
  // ================= ESTADOS =================
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [amount, setAmount] = useState(0)

  const [movements, setMovements] = useState<Movement[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [newLimit, setNewLimit] = useState(0)
  const [toast, setToast] = useState<{
  type: 'success' | 'error'
  message: string
} | null>(null)

  // ⚠️ por ahora hardcodeado (después lo conectamos bien)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)

useEffect(() => {
  const id = localStorage.getItem('activeBusinessId')
  setSelectedBusinessId(id)
}, [])

useEffect(() => {
  if (toast) {
    const timer = setTimeout(() => {
      setToast(null)
    }, 3000)

    return () => clearTimeout(timer)
  }
}, [toast])

  // ================= DATA =================
  const fetchCustomers = async () => {
    if (!selectedBusinessId) return

    setLoadingCustomers(true)

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', selectedBusinessId)
      .order('created_at', { ascending: false })

    setCustomers(data || [])
    setLoadingCustomers(false)
  }

  const fetchMovements = async (customerId: string) => {
  if (!selectedBusinessId) return

  setLoadingMovements(true)

  const { data } = await supabase
    .from('customer_movements')
    .select('*')
    .eq('customer_id', customerId)
    .eq('business_id', selectedBusinessId) // 🔐 filtro por negocio
    .order('created_at', { ascending: false })

  setMovements(data || [])
  setLoadingMovements(false)
}

  const updateDebt = async (type: 'add' | 'pay') => {
  if (!selectedCustomer || amount <= 0 || !selectedBusinessId) return

  const newDebt =
    type === 'add'
      ? selectedCustomer.debt_amount + amount
      : Math.max(0, selectedCustomer.debt_amount - amount)

  // 🔒 Validación contra el límite de crédito
  if (
    type === 'add' &&
    selectedCustomer.credit_limit &&
    newDebt > selectedCustomer.credit_limit
  ) {
    alert('⚠️ Supera el límite de crédito del cliente')
    return
  }

  const { error: updateError } = await supabase
  .from('customers')
  .update({ debt_amount: newDebt })
  .eq('id', selectedCustomer.id)
  .eq('business_id', selectedBusinessId)

if (updateError) {
  setToast({ type: 'error', message: 'Error actualizando deuda' })
  return
} // 🔒 protección extra

const { error: movementError } = await supabase
  .from('customer_movements')
  .insert({
    customer_id: selectedCustomer.id,
    business_id: selectedBusinessId,
    amount,
    type,
  })

if (movementError) {
  setToast({ type: 'error', message: 'Error registrando movimiento' })
  return
}

setToast({
  type: 'success',
  message:
    type === 'add'
      ? 'Deuda actualizada correctamente'
      : 'Pago registrado correctamente'
})

  setSelectedCustomer({
    ...selectedCustomer,
    debt_amount: newDebt,
  })

  setAmount(0)
  fetchMovements(selectedCustomer.id)
  fetchCustomers()
}

const createCustomer = async () => {
  if (!newCustomerName || !selectedBusinessId) return

  if (selectedCustomer) {
    const { error } = await supabase
      .from('customers')
      .update({
        name: newCustomerName,
        credit_limit: newLimit
      })
      .eq('id', selectedCustomer.id)
      .eq('business_id', selectedBusinessId)

    if (error) {
      setToast({ type: 'error', message: 'Error actualizando cliente' })
      return
    }

    setToast({ type: 'success', message: 'Cliente actualizado correctamente' })
    setSelectedCustomer(null)

  } else {
    const { error } = await supabase
      .from('customers')
      .insert({
        name: newCustomerName,
        business_id: selectedBusinessId,
        credit_limit: newLimit || 0,
        debt_amount: 0,
      })

    if (error) {
      setToast({ type: 'error', message: 'Error creando cliente' })
      return
    }

    setToast({ type: 'success', message: 'Cliente creado correctamente' })
  }

  setNewCustomerName('')
  setNewLimit(0)
  fetchCustomers()
}

  
 const updateCreditLimit = async () => {
  if (!selectedCustomer || !selectedBusinessId) return

  const { error } = await supabase
  .from('customers')
  .update({ credit_limit: newLimit })
  .eq('id', selectedCustomer.id)
  .eq('business_id', selectedBusinessId)

if (error) {
  setToast({ type: 'error', message: 'Error guardando límite' })
  return
}

setToast({ type: 'success', message: 'Límite actualizado correctamente' })

  setSelectedCustomer({
    ...selectedCustomer,
    credit_limit: newLimit,
  })

  fetchCustomers()
}
 
const handleEdit = (customer: Customer) => {
  setSelectedCustomer(customer)
  setNewCustomerName(customer.name)
  setNewLimit(customer.credit_limit || 0)
}

const handleDelete = async (id: string) => {
  if (!confirm('¿Eliminar cliente?')) return
  if (!selectedBusinessId) return

  try {
    // 1️⃣ eliminar movimientos del cliente
    await supabase
      .from('customer_movements')
      .delete()
      .eq('customer_id', id)
      .eq('business_id', selectedBusinessId)

    // 2️⃣ buscar ventas asociadas
    const { data: sales } = await supabase
      .from('sales')
      .select('id')
      .eq('customer_id', id)
      .eq('business_id', selectedBusinessId)

    if (sales && sales.length > 0) {
      const saleIds = sales.map(s => s.id)

      // 3️⃣ eliminar sale_items primero
      await supabase
        .from('sale_items')
        .delete()
        .in('sale_id', saleIds)

      // 4️⃣ eliminar ventas
      await supabase
        .from('sales')
        .delete()
        .eq('customer_id', id)
        .eq('business_id', selectedBusinessId)
    }

    // 5️⃣ eliminar cliente
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('business_id', selectedBusinessId)

    if (error) throw error

    setToast({ type: 'success', message: 'Cliente eliminado correctamente' })

    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null)
    }

    fetchCustomers()

  } catch (err) {
    setToast({ type: 'error', message: 'Error eliminando cliente' })
  }
}

  useEffect(() => {
  if (selectedBusinessId) {
    fetchCustomers()
  }
}, [selectedBusinessId])

const getRiskStatus = (debt: number, limit: number) => {
  if (!limit || limit === 0) return { label: 'Sin límite', color: 'gray' }

  const usage = (debt / limit) * 100

  if (usage >= 100) return { label: 'Riesgo alto', color: 'red' }
  if (usage >= 70) return { label: 'Riesgo medio', color: 'yellow' }
  return { label: 'Confiable', color: 'green' }
}


  // ================= UI =================
  return (
  <div className="space-y-6">

  {toast && (
  <div
    className={`p-4 rounded-xl text-sm font-medium ${
      toast.type === 'success'
        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
        : 'bg-red-500/10 text-red-400 border border-red-500/30'
    }`}
  >
    {toast.message}
  </div>
)}

    {/* HEADER */}
    <div>
      <h1 className="text-2xl font-semibold text-white">
        👥 Clientes
      </h1>
      <p className="text-gray-400 text-sm">
        Gestión de cuentas y riesgo financiero.
      </p>
    </div>

    
   {/* ================= NUEVO CLIENTE ================= */}
<div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6 space-y-4">
  <h2 className="text-white font-medium">Agregar cliente</h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <input
      type="text"
      placeholder="Nombre del cliente"
      value={newCustomerName}
      onChange={(e) => setNewCustomerName(e.target.value)}
      className="bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
    />

    <input
      type="number"
      placeholder="Límite de crédito"
      value={newLimit}
      onChange={(e) => setNewLimit(Number(e.target.value))}
      className="bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
    />

    <button
  onClick={createCustomer}
  className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl p-3 font-medium"
>
  {selectedCustomer ? 'Guardar cambios' : 'Crear cliente'}
</button>
  </div>
</div>

{/* ================= TABLA CLIENTES ================= */}
<div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl overflow-hidden mt-6">
  <div className="max-h-[450px] overflow-y-auto pr-2 sales-scroll">
    <table className="w-full text-sm">
      <thead className="bg-[#101018] text-gray-400 sticky top-0">
        <tr>
          <th className="p-4 text-left">Cliente</th>
          <th className="p-4 text-right">Deuda</th>
          <th className="p-4 text-right">Límite</th>
          <th className="p-4 text-center">Riesgo</th>
          <th className="p-4 text-center">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {customers.map((c) => {
          const risk = getRiskStatus(
            c.debt_amount,
            c.credit_limit || 0
          )

          return (
            <tr
              key={c.id}
              onClick={() => {
                setSelectedCustomer(c)
                setNewLimit(c.credit_limit || 0)
                fetchMovements(c.id)
              }}
              className="border-t border-[#1F1F24] hover:bg-[#101018] transition cursor-pointer"
            >
              <td className="p-4 text-white font-medium">
                {c.name}
              </td>

              <td className={`p-4 text-right font-semibold tabular-nums ${
                c.debt_amount > 0
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}>
                ${Number(c.debt_amount).toLocaleString()}
              </td>

              <td className="p-4 text-right tabular-nums text-gray-300">
                ${Number(c.credit_limit || 0).toLocaleString()}
              </td>

<td className="p-4 text-center">
  <div className="flex gap-3 justify-center">

    <button
      onClick={(e) => {
        e.stopPropagation()
        handleEdit(c)
      }}
      className="text-blue-400 hover:text-blue-300 transition text-sm"
    >
      ✏️ Editar
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation()
        handleDelete(c.id)
      }}
      className="text-red-400 hover:text-red-300 transition text-sm"
    >
      🗑 Eliminar
    </button>

  </div>
</td>

              <td className="p-4 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    risk.color === 'red'
                      ? 'bg-red-500/10 text-red-400'
                      : risk.color === 'yellow'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}
                >
                  {risk.label}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
</div>

      {/* ================= PANEL DETALLE ================= */}
      {selectedCustomer && (
        <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6 space-y-6">

          <div>
            <h2 className="text-lg font-semibold text-white">
              {selectedCustomer.name}
            </h2>
            <p className="text-gray-400 text-sm">
              Estado financiero
            </p>
          </div>

          {/* DEUDA ACTUAL */}
          <div>
            <p className="text-gray-400 text-sm">
              Deuda actual
            </p>
            <p className="text-3xl font-semibold text-red-400">
              ${Number(selectedCustomer.debt_amount).toLocaleString()}
            </p>
          </div>

{/* LIMITE DE CREDITO */}
<div>
  <p className="text-gray-400 text-sm mb-2">
    Límite de crédito
  </p>

  <div className="flex gap-3">
    <input
      type="number"
      value={newLimit}
      onChange={(e) => setNewLimit(Number(e.target.value))}
      placeholder="Ej: 15000"
     className="w-full bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
    />

    <button
      onClick={updateCreditLimit}
      className="w-full bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl p-3 font-medium"
    >
      Guardar límite
    </button>
  </div>
</div>


          {/* BARRA USO DE CRÉDITO */}
          {selectedCustomer.credit_limit || 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-2">
                Uso del crédito
              </p>

              <div className="w-full bg-[#101018] rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
  (selectedCustomer.debt_amount /
    (selectedCustomer?.credit_limit || 1)) >= 1
    ? 'bg-red-500'
    : (selectedCustomer.debt_amount /
        (selectedCustomer?.credit_limit || 1)) >= 0.7
    ? 'bg-yellow-500'
    : 'bg-green-500'
}`}

                  style={{
                    width: `${
                      (selectedCustomer.debt_amount /
(selectedCustomer?.credit_limit || 1)) * 100

                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ACCIONES */}
          <div className="space-y-3">
            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(Number(e.target.value))
              }
              placeholder="Monto"
              className="w-full bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
            />

            <div className="flex gap-3">
              <button
                onClick={() => updateDebt('add')}
                className="flex-1 bg-red-500 hover:bg-red-600 transition rounded-xl p-3 font-medium"
              >
                Sumar deuda
              </button>

              <button
                onClick={() => updateDebt('pay')}
                className="flex-1 bg-green-500 hover:bg-green-600 transition rounded-xl p-3 font-medium"
              >
                Registrar pago
              </button>
            </div>
          </div>

          {/* HISTORIAL */}
          <div>
            <h3 className="text-sm text-gray-400 mb-3">
              Movimientos recientes
            </h3>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 sales-scroll">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between bg-[#101018] p-3 rounded-xl text-sm"
                >
                  <span
  className={`px-2 py-1 rounded-md text-xs font-medium ${
    m.type === 'add'
      ? 'bg-red-500/15 text-red-400'
      : 'bg-green-500/15 text-green-400'
  }`}
>
  {m.type === 'add' ? '➕ Nueva deuda' : '➖ Pago'}
</span>
                  <span
                    className={
                      m.type === 'add'
                        ? 'text-red-400'
                        : 'text-green-400'
                    }
                  >
                    ${m.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  
)

}