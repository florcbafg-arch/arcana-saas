'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  stock_quantity: number
  min_stock_yellow: number
  min_stock_red: number
  unit: string
  price: number
  code?: string
}

type StockMovement = {
  id: string
  product_id: string
  change: number
  reason: string
  created_at: string
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [amount, setAmount] = useState(0)

  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'alert' | 'critical' | 'normal'>('all')
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  

  const getStockStatus = (product: Product) => {
  if (product.stock_quantity <= product.min_stock_red) {
    return 'red'
  }

  if (product.stock_quantity <= product.min_stock_yellow) {
    return 'yellow'
  }

  return 'green'
}

useEffect(() => {
  const id = localStorage.getItem('activeBusinessId')
  setSelectedBusinessId(id)
}, [])

useEffect(() => {
  if (selectedBusinessId) {
    fetchProducts()
  }
}, [selectedBusinessId])


  const fetchProducts = async () => {
    if (!selectedBusinessId) return

    setLoadingProducts(true)

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', selectedBusinessId)

    setProducts(data || [])
    setLoadingProducts(false)
  }

  const fetchMovements = async (productId: string) => {
    if (!selectedBusinessId) return

    setLoadingMovements(true)

    const { data } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .eq('business_id', selectedBusinessId)
      .order('created_at', { ascending: false })

    setMovements(data || [])
    setLoadingMovements(false)
  }
const addStock = async () => {
  if (!selectedProduct || amount === 0 || !selectedBusinessId) return

  const { error } = await supabase.rpc(
    "adjust_stock_atomic",
    {
      p_business_id: selectedBusinessId,
      p_product_id: selectedProduct.id,
      p_change: amount,
      p_reason: amount > 0 ? "Ingreso manual" : "Ajuste manual",
    }
  )

  if (error) {
    console.error("Error ajustando stock:", error)
    return
  }

  setAmount(0)

  await fetchProducts()

const { data } = await supabase
  .from('products')
  .select('*')
  .eq('id', selectedProduct.id)
  .single()

if (data) {
  setSelectedProduct(data)
}

await fetchMovements(selectedProduct.id)
  
}
const alertProducts = products.filter(
  (p) =>
    p.stock_quantity > p.min_stock_red &&
    p.stock_quantity <= p.min_stock_yellow
).length

const criticalProducts = products.filter(
  (p) =>
    p.stock_quantity <= p.min_stock_red
).length

useEffect(() => {
  if (!selectedProduct) return

  const stillVisible = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())

      if (!matchesSearch) return false

      const status = getStockStatus(product)

      if (filter === 'all') return true
      if (filter === 'critical') return status === 'red'
      if (filter === 'alert') return status === 'yellow'
      if (filter === 'normal') return status === 'green'

      return true
    })
    .some((p) => p.id === selectedProduct.id)

  if (!stillVisible) {
    setSelectedProduct(null)
    setMovements([])
  }
}, [search, filter])

  return (
    
    <div className="p-6 space-y-8">

      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          📦 Control de Stock
        </h1>
        <p className="text-gray-400 mt-1">
          Gestioná tu inventario en tiempo real.
        </p>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">

          <p className="text-gray-400 text-sm">Total productos</p>
          <p className="text-3xl font-bold text-white mt-2">
  {products.length}
</p>

        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm">En alerta</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
  {alertProducts}
</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm">Críticos</p>
       <p className="text-3xl font-bold text-red-500 mt-2">
  {criticalProducts}
</p>
        </div>

      </div>

      {/* ================= GRID PRINCIPAL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== IZQUIERDA PRODUCTOS ===== */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">

          <div className="flex justify-between items-center">
            <h2 className="text-white font-medium">Productos</h2>
            
  <input
  type="text"
  placeholder="Buscar producto..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }}
  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
          </div>

<div className="flex gap-2 mt-3">
  {[
    { label: 'Todos', value: 'all' },
    { label: 'En alerta', value: 'alert' },
    { label: 'Críticos', value: 'critical' },
    { label: 'Normales', value: 'normal' }
  ].map((btn) => (
    <button
      key={btn.value}
      onClick={() => setFilter(btn.value as any)}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
        filter === btn.value
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {btn.label}
    </button>
  ))}
</div>

         <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">


       {products
  .filter((product) => {
   const matchesSearch =
product.name.toLowerCase().includes(search.toLowerCase()) ||
product.code?.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    const status = getStockStatus(product)

    if (filter === 'all') return true
    if (filter === 'critical') return status === 'red'
    if (filter === 'alert') return status === 'yellow'
    if (filter === 'normal') return status === 'green'

    return true
  })
  .map((product) => {
      const status = getStockStatus(product)

const color =
  status === 'red'
    ? 'bg-red-500'
    : status === 'yellow'
    ? 'bg-yellow-400'
    : 'bg-green-500'


      return (
        <div
  key={product.id}
  onClick={() => {
    setSelectedProduct(product)
    fetchMovements(product.id)
  }}
  className={`flex justify-between items-center bg-gray-800 rounded-xl px-4 py-3 cursor-pointer transition ${
    selectedProduct?.id === product.id
      ? 'ring-2 ring-blue-500'
      : 'hover:bg-gray-700'
  }`}
>
          <div>
            <p className="text-white">{product.name}</p>
            <p className="text-gray-400 text-sm">
              Stock: {product.stock_quantity}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${color}`} />
        </div>
      )
    })}
</div>
</div>

{/* ===== DERECHA DETALLE PRODUCTO ===== */}
<div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">

  {!selectedProduct ? (
    <p className="text-gray-500 text-sm">
      Seleccioná un producto para ver el detalle.
    </p>
  ) : (
    <>
      {/* Nombre */}
      <div>
        <h2 className="text-white text-lg font-semibold">
          {selectedProduct.name}
        </h2>
        <p className="text-gray-400 text-sm">
          Unidad: {selectedProduct.unit}
        </p>
      </div>

      {/* Stock grande */}
      <div>
        <p className="text-gray-400 text-sm">Stock actual</p>
        <p className="text-4xl font-bold text-white">
          {selectedProduct.stock_quantity}
        </p>

        <p className="text-xs text-gray-500 mt-1">
  Umbral amarillo: {selectedProduct.min_stock_yellow} · 
  Umbral rojo: {selectedProduct.min_stock_red}
</p>

{/* Precio unitario */}
<div className="mt-4">
  <p className="text-gray-400 text-sm">
    Precio unitario
  </p>
  <p className="text-xl font-semibold text-white">
    ${selectedProduct.price.toLocaleString()}
  </p>
</div>

{/* Valor total */}
<div className="mt-3">
  <p className="text-gray-400 text-sm flex items-center gap-2">
    <span>💰</span> Valor total en stock
  </p>
  <p className="text-lg font-semibold text-blue-400">
    ${(selectedProduct.stock_quantity * selectedProduct.price).toLocaleString()}
  </p>
</div>

      </div>

      {/* Estado */}
      <div>
        {(() => {
          const status = getStockStatus(selectedProduct)

          if (status === 'red')
            return <p className="text-red-400">🔴 Crítico</p>

          if (status === 'yellow')
            return <p className="text-yellow-400">⚠️ Bajo</p>

          return <p className="text-green-400">🟢 Normal</p>
        })()}
      </div>

      {/* Barra visual */}
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            getStockStatus(selectedProduct) === 'red'
              ? 'bg-red-500'
              : getStockStatus(selectedProduct) === 'yellow'
              ? 'bg-yellow-400'
              : 'bg-green-500'
          }`}
          style={{
            width: `${Math.min(
              100,
              (selectedProduct.stock_quantity /
                (selectedProduct.min_stock_yellow * 2)) *
                100
            )}%`,
            
          }}
        />
        
        </div>
    
{/* Historial */}
<div className="pt-4 border-t border-gray-800 space-y-3">
  <p className="text-sm text-gray-400">Historial</p>

  {loadingMovements ? (
    <p className="text-gray-500 text-xs">Cargando...</p>
  ) : movements.length === 0 ? (
    <p className="text-gray-500 text-xs">
      No hay movimientos todavía.
    </p>
  ) : (
    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
      {movements.map((m) => (
        <div
          key={m.id}
          className="flex justify-between text-xs bg-gray-800 rounded-lg px-3 py-2"
        >
          <span
            className={
              m.change < 0
                ? 'text-red-400'
                : 'text-green-400'
            }
          >
            {m.change > 0 ? '+' : ''}
            {m.change}
          </span>

          <span className="text-gray-400 truncate max-w-[120px]">
  {m.reason === 'Ingreso manual' && '➕ Ingreso'}
  {m.reason === 'Ajuste manual' && '⚙️ Ajuste'}
  {m.reason === 'Venta' && '🛒 Venta'}
  {!['Ingreso manual','Ajuste manual','Venta'].includes(m.reason) && m.reason}
</span>

          <span className="text-gray-500">
            {new Date(m.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  )}
</div>
    </>
  )}
</div>

</div>




</div>
)
}    