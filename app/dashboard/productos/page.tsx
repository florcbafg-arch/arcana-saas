'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as XLSX from "xlsx"
import { useRef } from "react"

type Product = {
  id: string
  name: string
  business_id: string
  stock_quantity: number
  min_stock_yellow: number
  min_stock_red: number
  price: number
  unit: string
  active: boolean
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [newProductName, setNewProductName] = useState('')
  const [newStock, setNewStock] = useState(0)
  const [newMinStock, setNewMinStock] = useState(1)
  const [loading, setLoading] = useState(false)
  const [newUnit, setNewUnit] = useState('unidad')

  const [isOpen, setIsOpen] = useState(false)
  const [newPrice, setNewPrice] = useState(0)
  const [newActive, setNewActive] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [toast, setToast] = useState<{
  type: "success" | "error"
  message: string
} | null>(null)

useEffect(() => {
  const id = localStorage.getItem('activeBusinessId')

  console.log("ID desde localStorage:", id)

  if (id) {
    setSelectedBusinessId(id)
  } else {
    console.log("No hay business activo")
  }
}, [])


  const fetchProducts = async () => {
    if (!selectedBusinessId) return

    setLoading(true)

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', selectedBusinessId)
      .order('created_at', { ascending: false })

    setProducts(data || [])
    setLoading(false)
  }

const createProduct = async () => {
  if (!newProductName.trim()) {
    setToast({ type: "error", message: "Ingresá un nombre válido" })
    return
  }

  try {
    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update({
          name: newProductName,
          unit: newUnit,
          stock_quantity: newStock,
          min_stock_yellow: newMinStock,
          min_stock_red: Math.max(1, Math.floor(newMinStock / 2)),
          price: newPrice,
          active: newActive,
        })
        .eq('id', editingId)

      if (error) throw error

      setToast({ type: "success", message: "Producto actualizado correctamente" })
      setEditingId(null)
    } else {
      const { error } = await supabase
        .from('products')
        .insert({
          name: newProductName,
          business_id: selectedBusinessId,
          unit: newUnit,
          stock_quantity: newStock,
          min_stock_yellow: newMinStock,
          min_stock_red: Math.max(1, Math.floor(newMinStock / 2)),
          price: newPrice,
          active: newActive,
        })

      if (error) throw error

      setToast({ type: "success", message: "Producto creado correctamente" })
    }

    setNewProductName('')
    setNewUnit('unidad')
    setNewStock(0)
    setNewMinStock(1)
    setNewPrice(0)
    setNewActive(true)
    setIsOpen(false)

    fetchProducts()

  } catch (err: any) {
    setToast({ type: "error", message: err.message || "Error al guardar producto" })
  }
}


 useEffect(() => {
  if (selectedBusinessId) {
    fetchProducts()
  }
}, [selectedBusinessId])

const updatePrice = async (id: string, newPrice: number) => {
  await supabase
    .from('products')
    .update({ price: newPrice })
    .eq('id', id)

  fetchProducts()
}

const handleDelete = async (id: string) => {
  if (!confirm("¿Eliminar producto?")) return

  await supabase
    .from('products')
    .delete()
    .eq('id', id)

  fetchProducts()
}
const handleEdit = (product: Product) => {
  setEditingId(product.id)
  setNewProductName(product.name)
  setNewPrice(product.price)
  setNewStock(product.stock_quantity)
  setNewMinStock(product.min_stock_yellow)
  setNewUnit(product.unit)
  setNewActive(product.active)
  setIsOpen(true)
}

useEffect(() => {
  if (!toast) return

  const timer = setTimeout(() => {
    setToast(null)
  }, 2500)

  return () => clearTimeout(timer)
}, [toast])

const handleExcelUpload = async (e: any) => {

  const file = e.target.files[0]

  if (!file) return

  const data = await file.arrayBuffer()

  const workbook = XLSX.read(data)

  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rows: any[] = XLSX.utils.sheet_to_json(sheet)

  console.log(rows)

  for (const row of rows) {

    await supabase.from("products").insert({
      name: row.name,
      price: row.price,
      stock_quantity: row.stock,
      unit: row.unit || "unidad",
      business_id: selectedBusinessId
    })

  }

  fetchProducts()

  setToast({
    type: "success",
    message: "Productos importados correctamente"
  })

}

  return (
  <div className="p-6 space-y-8">


  <input
  type="file"
  accept=".xlsx,.xls"
  ref={fileInputRef}
  onChange={handleExcelUpload}
  style={{ display: "none" }}
/>
   

{toast && (
  <div
    className={`mb-4 p-4 rounded-xl text-sm font-medium
      ${toast.type === "success"
        ? "bg-green-900 text-green-400 border border-green-700"
        : "bg-red-900 text-red-400 border border-red-700"
      }`}
  >
    {toast.message}
  </div>

)}

    {/* HEADER */}
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          📦 Productos
        </h1>
        <p className="text-gray-400 mt-1">
          Gestioná tu catálogo y stock.
        </p>
      </div>

<div className="flex gap-3">

<button
  onClick={() => fileInputRef.current?.click()}
  className="bg-[#6C5CE7] hover:bg-[#5A4BD1] transition rounded-xl px-5 py-3 font-semibold"
>
  📥 Importar
</button>

<button
  onClick={() => setIsOpen(true)}
  className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-5 py-3 font-semibold"
>
  ➕ Nuevo producto
</button>

</div>

<div className="flex justify-between items-center mb-4">
  <input
    type="text"
    placeholder="Buscar producto..."
    className="bg-[#0B0B10] border border-[#2A2A32] rounded-xl px-4 py-2 text-white w-64 focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40"
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>

    {/* TABLA */}
    <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl overflow-hidden">
  <div className="max-h-[500px] overflow-y-auto">
    <table className="w-full text-sm">

        <thead className="bg-[#0F0F14] text-gray-400">
  <tr className="text-left">
    <th className="p-4">Producto</th>
    <th className="p-4">Precio</th>
    <th className="p-4">Stock</th>
    <th className="p-4">Estado</th>
    <th className="p-4 text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>

          {products
  .filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .map((p) => {
            let estado = 'Disponible'
            let color = 'green'

            if (p.stock_quantity === 0) {
              estado = 'Agotado'
              color = 'red'
            } else if (p.stock_quantity <= p.min_stock_yellow) {
              estado = 'Bajo stock'
              color = 'yellow'
            }

            return (
              <tr
                key={p.id}
                className="border-t border-[#1F1F24] hover:bg-[#101018] transition"
              >
               <td className="p-4 text-white font-medium">
  {p.name}
</td>

<td className="p-4 font-semibold text-[#1F6BFF]">
  ${Number(p.price).toLocaleString()}
</td>

<td className="p-4 font-bold text-lg text-white">
  {p.stock_quantity}
</td>

<td className="p-4">
  <span
    className={`px-3 py-1 rounded-full text-xs ${
      color === 'green'
        ? 'bg-green-500/10 text-green-400'
        : color === 'yellow'
        ? 'bg-yellow-500/10 text-yellow-400'
        : 'bg-red-500/10 text-red-400'
    }`}
  >
    {estado}
  </span>
</td>

<td className="p-4">
  <div className="flex gap-3 justify-center">
    <button
      onClick={() => handleEdit(p)}
      className="text-blue-400 hover:text-blue-300 transition text-sm"
    >
      ✏️ Editar
    </button>

    <button
      onClick={() => handleDelete(p.id)}
      className="text-red-400 hover:text-red-300 transition text-sm"
    >
      🗑 Eliminar
    </button>
  </div>
</td> 
              </tr>
            )
          })}

        </tbody>

      </table>

</div>

      {products.length === 0 && (
        <div className="p-6 text-gray-400">
          No hay productos cargados.
        </div>
      )}

    </div>
{isOpen && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-8 w-full max-w-md space-y-6">

      <h2 className="text-2xl font-semibold text-white">
        Nuevo producto
      </h2>

      <div className="space-y-5">

        {/* Nombre */}
        <div className="space-y-1">
          <label className="text-sm text-gray-400">
            Nombre del producto
          </label>
          <input
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white
            focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
          />
        </div>

        {/* Unidad */}
        <div className="space-y-1">
          <label className="text-sm text-gray-400">
            Unidad de venta
          </label>
          <select
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white
            focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
          >
            <option value="unidad">Unidad</option>
            <option value="kg">Kilo</option>
            <option value="litro">Litro</option>
            <option value="pack">Pack</option>
          </select>
        </div>

        {/* Precio */}
        <div className="space-y-1">
          <label className="text-sm text-gray-400">
            Precio de venta
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              $
            </span>

            <input
              type="number"
              placeholder="Ej: 15000"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl 
              p-3 pl-8 text-white
              focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
            />
          </div>
        </div>

        {/* Stock inicial */}
        <div className="space-y-1">
          <label className="text-sm text-gray-400">
            Stock inicial
          </label>
          <input
            type="number"
            placeholder="Cantidad disponible al cargar"
            value={newStock}
            onChange={(e) => setNewStock(Number(e.target.value))}
            className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white
            focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
          />
        </div>

        {/* Stock mínimo */}
        <div className="space-y-1">
          <label className="text-sm text-gray-400">
            Stock mínimo (alerta)
          </label>
          <input
            type="number"
            min={1}
            placeholder="Ej: 5"
            value={newMinStock}
            onChange={(e) =>
              setNewMinStock(Math.max(1, Number(e.target.value)))
            }
            className="w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white
            focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
          />
        </div>

        {/* Activo */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            checked={newActive}
            onChange={(e) => setNewActive(e.target.checked)}
          />
          <label className="text-sm text-gray-400">
            Producto activo
          </label>
        </div>

      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 rounded-xl border border-[#1F1F24] hover:bg-[#1A1A22] transition"
        >
          Cancelar
        </button>

        <button
          onClick={createProduct}
          className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition px-5 py-2 rounded-xl font-semibold"
        >
          Guardar
        </button>
            </div>
    </div>
  </div>
)}
  </div>

  </div>
)
}
