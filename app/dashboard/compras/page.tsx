'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'


export default function ComprasPage() {
const [isOpen, setIsOpen] = useState(false)
const [suppliers, setSuppliers] = useState<any[]>([])
const [products, setProducts] = useState<any[]>([])
const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
const [selectedSupplierId, setSelectedSupplierId] = useState('')
const [selectedProductId, setSelectedProductId] = useState('')
const [quantity, setQuantity] = useState(1)
const [unitCost, setUnitCost] = useState(0)
const [purchaseItems, setPurchaseItems] = useState<any[]>([])

useEffect(() => {
  const id = localStorage.getItem('activeBusinessId')
  setSelectedBusinessId(id)
}, [])

useEffect(() => {
  if (!selectedBusinessId) return

  fetchSuppliers()
  fetchProducts()
}, [selectedBusinessId])

const fetchSuppliers = async () => {
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('business_id', selectedBusinessId)

  setSuppliers(data || [])
}

const fetchProducts = async () => {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', selectedBusinessId)

  setProducts(data || [])
}

const addPurchaseItem = () => {
  if (!selectedProductId || quantity <= 0 || unitCost < 0) return

  const product = products.find((p) => p.id === selectedProductId)
  if (!product) return

  setPurchaseItems((prev) => [
    ...prev,
    {
      product_id: product.id,
      name: product.name,
      quantity,
      unit_cost: unitCost,
      subtotal: quantity * unitCost,
    },
  ])

  setSelectedProductId('')
  setQuantity(1)
  setUnitCost(0)
}

const purchaseTotal = purchaseItems.reduce(
  (acc, item) => acc + item.subtotal,
  0
)

const savePurchase = async () => {
  if (!selectedBusinessId || purchaseItems.length === 0) return

  const res = await fetch('/api/purchases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      business_id: selectedBusinessId,
      supplier_id: selectedSupplierId || null,
      notes: 'Compra registrada desde Arcana',
      items: purchaseItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost
      }))
    })
  })

  const data = await res.json()

  if (!res.ok) {
    alert(data.error || 'Error al guardar compra')
    return
  }

  alert('Compra guardada y stock actualizado ✅')

  setPurchaseItems([])
  setSelectedSupplierId('')
  setSelectedProductId('')
  setQuantity(1)
  setUnitCost(0)
  setIsOpen(false)

  fetchProducts()
}

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">📦 Compras</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestiona ingresos de mercadería, proveedores y costos.
          </p>
        </div>

        <button
  onClick={() => setIsOpen(true)}
  className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-5 py-3 font-semibold"
>
  + Nueva compra
</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#11131A] border border-[#242838] rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Compras del mes</p>
          <h2 className="text-2xl font-bold mt-2">0</h2>
        </div>

        <div className="bg-[#11131A] border border-[#242838] rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total invertido</p>
          <h2 className="text-2xl font-bold mt-2">$0</h2>
        </div>

        <div className="bg-[#11131A] border border-[#242838] rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Productos ingresados</p>
          <h2 className="text-2xl font-bold mt-2">0</h2>
        </div>

        <div className="bg-[#11131A] border border-[#242838] rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Última compra</p>
          <h2 className="text-lg font-bold mt-2">Sin registros</h2>
        </div>
      </div>

      <div className="bg-[#11131A] border border-[#242838] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#242838]">
          <h2 className="font-semibold">Historial de compras</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#0B0D13] text-slate-400">
            <tr>
              <th className="text-left p-4">Fecha</th>
              <th className="text-left p-4">Proveedor</th>
              <th className="text-left p-4">Productos</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t border-[#242838]">
              <td className="p-4 text-slate-400">—</td>
              <td className="p-4 text-slate-400">Sin compras registradas</td>
              <td className="p-4 text-slate-400">—</td>
              <td className="p-4 text-slate-400">$0</td>
              <td className="p-4">
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                  Pendiente
                </span>
              </td>
              <td className="p-4 text-slate-500">—</td>
            </tr>
          </tbody>
        </table>

{isOpen && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-[#11131A] border border-[#242838] rounded-2xl w-full max-w-2xl p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Nueva compra</h2>
          <p className="text-sm text-slate-400">
            Registra productos comprados y actualiza stock.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-sm text-slate-300">Proveedor</label>
        <select
  value={selectedSupplierId}
  onChange={(e) => setSelectedSupplierId(e.target.value)}
  className="mt-2 w-full bg-[#0B0D13] border border-[#242838] rounded-xl px-4 py-3 outline-none"
>
  <option value="">Seleccionar proveedor</option>
  {suppliers.map((supplier) => (
    <option key={supplier.id} value={supplier.id}>
      {supplier.name}
    </option>
  ))}
</select>
        </div>

        <div>
          <label className="text-sm text-slate-300">Fecha</label>
          <input
            type="date"
            className="mt-2 w-full bg-[#0B0D13] border border-[#242838] rounded-xl px-4 py-3 outline-none"
          />
        </div>
      </div>

      <div className="border border-[#242838] rounded-2xl p-4 mb-5">
        <h3 className="font-semibold mb-4">Productos comprados</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
  <div>
    <label className="text-xs text-slate-400 mb-1 block">Producto</label>
    <select
      value={selectedProductId}
      onChange={(e) => setSelectedProductId(e.target.value)}
      className="w-full bg-[#0B0D13] border border-[#242838] rounded-xl px-3 py-3 outline-none"
    >
      <option value="">Seleccionar</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} - Stock: {product.stock_quantity}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="text-xs text-slate-400 mb-1 block">Cantidad</label>
    <input
      type="number"
      min={1}
      value={quantity}
      onChange={(e) => setQuantity(Number(e.target.value))}
      placeholder="Ej: 3"
      className="w-full bg-[#0B0D13] border border-[#242838] rounded-xl px-3 py-3 outline-none"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400 mb-1 block">Costo unitario</label>
    <input
      type="number"
      min={0}
      value={unitCost}
      onChange={(e) => setUnitCost(Number(e.target.value))}
      placeholder="Ej: 12000"
      className="w-full bg-[#0B0D13] border border-[#242838] rounded-xl px-3 py-3 outline-none"
    />
  </div>

  <div className="flex items-end">
    <button
      type="button"
      onClick={addPurchaseItem}
      className="w-full bg-[#1F6BFF] hover:bg-[#2E7BFF] rounded-xl px-3 py-3 font-semibold"
    >
      + Agregar
    </button>
  </div>
</div>
      </div>

{purchaseItems.length > 0 && (
  <div className="mt-5 space-y-2">
    <h4 className="text-sm font-semibold text-slate-300">
      Productos agregados
    </h4>

    {purchaseItems.map((item, index) => (
      <div
        key={index}
        className="flex justify-between items-center bg-[#0B0D13] border border-[#242838] rounded-xl px-4 py-3 text-sm"
      >
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-slate-400 text-xs">
            {item.quantity} unidades · ${item.unit_cost} c/u
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-semibold">${item.subtotal}</span>

          <button
            type="button"
            onClick={() =>
              setPurchaseItems((prev) => prev.filter((_, i) => i !== index))
            }
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
    ))}
  </div>
)}

      <div className="flex justify-between items-center">
        <p className="text-lg font-bold">Total: ${purchaseTotal}</p>

        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="bg-[#242838] hover:bg-[#30364A] rounded-xl px-5 py-3 font-semibold"
          >
            Cancelar
          </button>

    <button
  type="button"
  onClick={savePurchase}
  disabled={purchaseItems.length === 0}
  className="bg-[#1F6BFF] hover:bg-[#2E7BFF] disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl px-5 py-3 font-semibold"
>
  Guardar compra
</button>
        </div>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  )
}