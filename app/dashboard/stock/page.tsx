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
  barcode?: string
  brand?: string | null
  quantity?: string | null
  cost_price?: number
  sale_type?: 'unit' | 'weight'
  price_by?: string
  package_weight_kg?: number | null
  package_cost?: number | null
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
  const [filter, setFilter] = useState<
  'all' | 'out' | 'alert' | 'critical' | 'normal'
>('all')
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

const matchesStockFilter = (product: Product) => {
  const status = getStockStatus(product)

  if (filter === 'all') return true
  if (filter === 'out') return product.stock_quantity <= 0

  if (filter === 'critical') {
    return product.stock_quantity > 0 && status === 'red'
  }

  if (filter === 'alert') return status === 'yellow'
  if (filter === 'normal') return status === 'green'

  return true
}

const matchesProductSearch = (product: Product) => {
  const term = search.trim().toLowerCase()

  if (!term) return true

  return [
    product.name,
    product.brand,
    product.quantity,
    product.code,
    product.barcode
  ].some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(term)
  )
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

const getProfitStatus = (product: Product) => {
  const margin = (product.price || 0) - (product.cost_price || 0)

  if (margin < 0) return 'loss'
  if (margin === 0) return 'zero'
  if (margin <= product.price * 0.2) return 'low'

  return 'good'
}

const getProfitLabel = (product: Product) => {
  const status = getProfitStatus(product)

  if (status === 'loss') return '💀 Con pérdida'
  if (status === 'zero') return '⚠️ Sin margen'
  if (status === 'low') return '⚠️ Margen bajo'

  return '🔥 Muy rentable'
}

  const fetchProducts = async () => {
    if (!selectedBusinessId) return

    setLoadingProducts(true)

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', selectedBusinessId)
      .eq('active', true)

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
  .eq('active', true)
  .single()

if (data) {
  setSelectedProduct(data)
}

await fetchMovements(selectedProduct.id)
  
}
const outOfStockProducts = products.filter(
  (product) => product.stock_quantity <= 0
).length

const criticalProducts = products.filter(
  (product) =>
    product.stock_quantity > 0 &&
    product.stock_quantity <= product.min_stock_red
).length

const alertProducts = products.filter(
  (product) =>
    product.stock_quantity > product.min_stock_red &&
    product.stock_quantity <= product.min_stock_yellow
).length

useEffect(() => {
  if (!selectedProduct) return

  const stillVisible = products
    .filter((product) => {
      const matchesSearch = matchesProductSearch(product)

      if (!matchesSearch) return false

      return matchesStockFilter(product)
    })
    .some((p) => p.id === selectedProduct.id)

  if (!stillVisible) {
    setSelectedProduct(null)
    setMovements([])
  }
}, [search, filter])

const attentionProducts = products
  .filter((product) => getStockStatus(product) !== 'green')
  .sort((a, b) => {
    const priority = {
      red: 0,
      yellow: 1,
      green: 2
    }

    const statusDifference =
      priority[getStockStatus(a)] - priority[getStockStatus(b)]

    if (statusDifference !== 0) return statusDifference

    return a.stock_quantity - b.stock_quantity
  })
  .slice(0, 3)

const formatStockQuantity = (product: Product) => {
  if (product.sale_type === 'weight') {
    const totalGrams = Math.round(product.stock_quantity * 1000)
    const kilograms = Math.floor(totalGrams / 1000)
    const grams = totalGrams % 1000

    if (kilograms === 0) return `${grams} g`
    if (grams === 0) return `${kilograms} kg`

    return `${kilograms} kg ${grams} g`
  }

  const quantity = product.stock_quantity.toLocaleString('es-AR', {
    maximumFractionDigits: 3
  })

  return `${quantity} ${
    product.stock_quantity === 1 ? 'unidad' : 'unidades'
  }`
}

const formatProductPrice = (product: Product) => {
  const price = Number(product.price || 0).toLocaleString('es-AR')
  const priceUnit =
    product.sale_type === 'weight' ? '100 g' : 'unidad'

  return `$${price} / ${priceUnit}`
}

  return (
    
    <div className="p-4 md:p-6 space-y-5 md:space-y-8">

      {/* ================= HEADER WEB ================= */}
<div className="hidden md:flex items-start justify-between gap-6">
  <div>
    <h1 className="text-3xl font-semibold text-white">
      Control de Stock
    </h1>

    <p className="text-gray-400 mt-1">
      Entendé qué pasa con tu mercadería y actuá a tiempo.
    </p>
  </div>
</div>

      {/* ================= KPI CARDS ================= */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-5">
  <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-full bg-blue-500/15 flex items-center justify-center text-xl">
      📦
    </div>

    <div>
      <p className="text-gray-400 text-xs md:text-sm">
        Productos activos
      </p>

      <p className="text-2xl md:text-3xl font-bold text-white mt-0.5">
        {products.length}
      </p>
    </div>
  </div>
</div>

 <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-5">
  <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-full bg-red-500/15 flex items-center justify-center text-xl">
      ⛔
    </div>

    <div>
      <p className="text-gray-400 text-xs md:text-sm">
        Sin stock
      </p>

      <p className="text-2xl md:text-3xl font-bold text-red-500 mt-0.5">
        {outOfStockProducts}
      </p>
    </div>
  </div>
</div>

  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-5">
  <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-full bg-orange-500/15 flex items-center justify-center text-xl">
      🚨
    </div>

    <div>
      <p className="text-gray-400 text-xs md:text-sm">
        Stock crítico
      </p>

      <p className="text-2xl md:text-3xl font-bold text-orange-500 mt-0.5">
        {criticalProducts}
      </p>
    </div>
  </div>
</div>

<div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-5">
  <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-full bg-yellow-500/15 flex items-center justify-center text-xl">
      ⚠️
    </div>

    <div>
      <p className="text-gray-400 text-xs md:text-sm">
        Bajo stock
      </p>

      <p className="text-2xl md:text-3xl font-bold text-yellow-400 mt-0.5">
        {alertProducts}
      </p>
    </div>
  </div>
</div>

</div>

{/* ================= NECESITAN TU ATENCIÓN WEB ================= */}
<div className="hidden md:block bg-gray-900 border border-gray-800 rounded-2xl p-5">
  <div className="flex items-center justify-between gap-4 mb-4">
    <div>
      <h2 className="text-white text-lg font-semibold">
        Necesitan tu atención
      </h2>

      <p className="text-gray-400 text-sm mt-1">
        Productos que conviene revisar primero.
      </p>
    </div>

    <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-full">
      {attentionProducts.length} prioritarios
    </span>
  </div>

  {attentionProducts.length === 0 ? (
    <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-4">
      <p className="text-green-400 font-medium">
        Todo bajo control
      </p>

      <p className="text-gray-400 text-sm mt-1">
        No hay productos con stock crítico o bajo.
      </p>
    </div>
  ) : (
    <div className="space-y-2">
      {attentionProducts.map((product) => {
        const status = getStockStatus(product)
        const isOutOfStock = product.stock_quantity <= 0

        const statusLabel = isOutOfStock
          ? 'Sin stock'
          : status === 'red'
          ? 'Stock crítico'
          : 'Bajo stock'

        const statusClasses = isOutOfStock
          ? 'text-red-400 bg-red-500/10 border-red-500/20'
          : status === 'red'
          ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
          : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => {
              setSelectedProduct(product)
              fetchMovements(product.id)
            }}
            className="w-full flex items-center justify-between gap-4 bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-left hover:bg-[#1A2233] transition"
          >
            <div className="min-w-0">
              <p className="text-white font-medium truncate">
                {product.name}
              </p>

              <p className="text-gray-400 text-sm mt-1">
                {isOutOfStock
                  ? 'No quedan existencias'
                  : `Quedan ${formatStockQuantity(product)}`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-xs font-medium border px-2.5 py-1 rounded-full ${statusClasses}`}
              >
                {statusLabel}
              </span>

              <span className="text-gray-500 text-xl">
                ›
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )}
</div>

      {/* ================= GRID PRINCIPAL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== IZQUIERDA PRODUCTOS ===== */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-6 space-y-4">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

  <h2 className="text-white font-semibold text-xl">
    Productos
  </h2>

  <input
    type="text"
    placeholder="🔎 Buscar producto..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
      }
    }}
    className="
      w-full md:w-[280px]
      bg-[#111827]
      border border-[#1F2937]
      rounded-xl
      px-4 py-3
      text-sm text-white
      placeholder-gray-500
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500/50
      transition
    "
  />

</div>

<div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
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

         <div className="max-h-[620px] overflow-y-auto pr-1 space-y-3 scrollbar-hide">


       {products
  .filter((product) => {
   if (!matchesProductSearch(product)) return false

    return matchesStockFilter(product)
  })
  .map((product) => {
      const status = getStockStatus(product)

const color =
  status === 'red'
    ? 'bg-red-500'
    : status === 'yellow'
    ? 'bg-yellow-400'
    : 'bg-green-500'

    const statusLabel =
  status === 'red'
    ? 'Crítico'
    : status === 'yellow'
    ? 'En alerta'
    : 'Normal'

const statusTextColor =
  status === 'red'
    ? 'text-red-400'
    : status === 'yellow'
    ? 'text-yellow-400'
    : 'text-green-400'

      return (
        <div
  key={product.id}
  onClick={() => {
    setSelectedProduct(product)
    fetchMovements(product.id)
  }}
  className={`
    flex items-center justify-between gap-3
    bg-[#111827]
    border border-[#1F2937]
    rounded-2xl
    px-4 py-4
    cursor-pointer
    transition-all
    active:scale-[0.99]
    ${
      selectedProduct?.id === product.id
        ? 'md:ring-2 md:ring-blue-500 md:border-blue-500'
        : 'hover:bg-[#1A2233]'
    }
  `}
>
  <div className="min-w-0 flex-1">
    <p className="text-white font-semibold leading-tight truncate">
      {product.name}
    </p>

    <div className="flex items-center gap-2 mt-1">
      <p className="text-gray-400 text-sm">
        Stock:{" "}
        <span className="text-white font-medium">
          {formatStockQuantity(product)}
        </span>
      </p>

      <span className="text-gray-600">•</span>

      <p className={`text-xs font-medium ${statusTextColor}`}>
        {statusLabel}
      </p>
    </div>
  </div>

  <div className="flex items-center gap-3">
    <div className={`w-3 h-3 rounded-full shrink-0 ${color}`} />

    <span className="md:hidden text-gray-500 text-xl">
      ›
    </span>
  </div>
</div>
      )
    })}
</div>
</div>

{/* ===== DERECHA DETALLE PRODUCTO ===== */}
<div className="hidden lg:block bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">

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
          {formatStockQuantity(selectedProduct)}
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
    {formatProductPrice(selectedProduct)}
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

{/* Rentabilidad */}
<div className="mt-3 bg-gray-800/70 border border-gray-700 rounded-xl p-4">
  <p className="text-gray-400 text-sm mb-2">
    Rentabilidad
  </p>

  <p
    className={`text-lg font-bold ${
      getProfitStatus(selectedProduct) === 'loss'
        ? 'text-red-400'
        : getProfitStatus(selectedProduct) === 'low' ||
          getProfitStatus(selectedProduct) === 'zero'
        ? 'text-yellow-400'
        : 'text-green-400'
    }`}
  >
    {getProfitLabel(selectedProduct)}
  </p>

  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
    <div>
      <p className="text-gray-500">
        Costo real
      </p>
      <p className="text-white font-semibold">
        ${(selectedProduct.cost_price || 0).toLocaleString()}
      </p>
    </div>

    <div>
      <p className="text-gray-500">
        Margen
      </p>
      <p
        className={`font-semibold ${
          (selectedProduct.price || 0) - (selectedProduct.cost_price || 0) < 0
            ? 'text-red-400'
            : 'text-green-400'
        }`}
      >
        ${((selectedProduct.price || 0) - (selectedProduct.cost_price || 0)).toLocaleString()}
      </p>
    </div>
  </div>

  <p className="text-xs text-gray-500 mt-3">
    {selectedProduct.sale_type === 'weight'
      ? 'Valores calculados por 100g.'
      : 'Valores calculados por unidad.'}
  </p>
</div>

{/* Ganancia potencial */}
<div className="mt-4 bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">

  <p className="text-gray-400 text-sm mb-2">
    Ganancia potencial
  </p>

  <p className="text-2xl font-bold text-green-400">
    $
    {(
      ((selectedProduct.price || 0) -
        (selectedProduct.cost_price || 0)) *
      selectedProduct.stock_quantity
    ).toLocaleString('es-AR')}
  </p>

  <p className="text-xs text-gray-500 mt-2">
    Ganancia estimada si vendés todo el stock actual.
  </p>

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

{/* ================= DETALLE MOBILE ================= */}
{selectedProduct && (
  <div
    className="lg:hidden fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end"
    onClick={() => {
      setSelectedProduct(null)
      setMovements([])
    }}
  >
    <div
      className="w-full max-h-[88vh] bg-[#111827] border-t border-[#263247] rounded-t-3xl overflow-hidden flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Indicador superior */}
      <div className="flex justify-center pt-3">
        <div className="w-12 h-1.5 rounded-full bg-gray-700" />
      </div>

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-5 border-b border-gray-800">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white leading-tight">
            {selectedProduct.name}
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Unidad: {selectedProduct.unit}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null)
            setMovements([])
          }}
          className="w-10 h-10 shrink-0 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center text-xl"
          aria-label="Cerrar detalle"
        >
          ✕
        </button>
      </div>

      {/* Contenido desplazable */}
      <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

        {/* Estado y stock */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">
                Stock actual
              </p>

              <p className="text-4xl font-bold text-white mt-1">
                {formatStockQuantity(selectedProduct)}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {selectedProduct.unit}
              </p>
            </div>

            <div>
              {getStockStatus(selectedProduct) === 'red' && (
                <span className="inline-flex px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
                  🔴 Crítico
                </span>
              )}

              {getStockStatus(selectedProduct) === 'yellow' && (
                <span className="inline-flex px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-semibold">
                  🟡 En alerta
                </span>
              )}

              {getStockStatus(selectedProduct) === 'green' && (
                <span className="inline-flex px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">
                  🟢 Normal
                </span>
              )}
            </div>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mt-4">
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
                  selectedProduct.min_stock_yellow > 0
                    ? (selectedProduct.stock_quantity /
                        (selectedProduct.min_stock_yellow * 2)) *
                        100
                    : 100
                )}%`
              }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Alerta: {selectedProduct.min_stock_yellow} · Crítico:{" "}
            {selectedProduct.min_stock_red}
          </p>
        </div>

        {/* Valores principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
            <p className="text-xs text-gray-400">
              Precio
            </p>

            <p className="text-lg text-white font-bold mt-1">
              {formatProductPrice(selectedProduct)}
            </p>
          </div>

          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
            <p className="text-xs text-gray-400">
              Costo
            </p>

            <p className="text-lg text-white font-bold mt-1">
              ${Number(selectedProduct.cost_price || 0).toLocaleString('es-AR')}
            </p>
          </div>

          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
            <p className="text-xs text-gray-400">
              Margen
            </p>

            <p
              className={`text-lg font-bold mt-1 ${
                (selectedProduct.price || 0) -
                  (selectedProduct.cost_price || 0) <
                0
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}
            >
              $
              {(
                (selectedProduct.price || 0) -
                (selectedProduct.cost_price || 0)
              ).toLocaleString('es-AR')}
            </p>
          </div>

          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
            <p className="text-xs text-gray-400">
              Valor en stock
            </p>

            <p className="text-lg text-blue-400 font-bold mt-1">
              $
              {(
                selectedProduct.stock_quantity *
                selectedProduct.price
              ).toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {/* Rentabilidad */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
          <p className="text-sm text-gray-400">
            Rentabilidad
          </p>

          <p
            className={`text-lg font-bold mt-2 ${
              getProfitStatus(selectedProduct) === 'loss'
                ? 'text-red-400'
                : getProfitStatus(selectedProduct) === 'low' ||
                  getProfitStatus(selectedProduct) === 'zero'
                ? 'text-yellow-400'
                : 'text-green-400'
            }`}
          >
            {getProfitLabel(selectedProduct)}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            {selectedProduct.sale_type === 'weight'
              ? 'Valores calculados por 100 gramos.'
              : 'Valores calculados por unidad.'}
          </p>
        </div>

        {/* Ganancia potencial */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4">
          <p className="text-sm text-gray-400">
            Ganancia potencial
          </p>

          <p className="text-2xl font-bold text-green-400 mt-2">
            $
            {(
              ((selectedProduct.price || 0) -
                (selectedProduct.cost_price || 0)) *
              selectedProduct.stock_quantity
            ).toLocaleString('es-AR')}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Ganancia estimada si vendés todo el stock actual.
          </p>
        </div>

        {/* Historial */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold">
                Historial
              </p>

              <p className="text-xs text-gray-500">
                Últimos movimientos del producto
              </p>
            </div>

            <span className="text-xs text-gray-500">
              {movements.length} movimientos
            </span>
          </div>

          {loadingMovements ? (
            <div className="bg-gray-800/60 rounded-2xl p-4">
              <p className="text-gray-400 text-sm">
                Cargando historial...
              </p>
            </div>
          ) : movements.length === 0 ? (
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
              <p className="text-gray-400 text-sm">
                Todavía no hay movimientos registrados.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between gap-3 bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                        movement.change < 0
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}
                    >
                      {movement.change < 0 ? '−' : '+'}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {movement.reason === 'Ingreso manual' && 'Ingreso'}
                        {movement.reason === 'Ajuste manual' && 'Ajuste'}
                        {movement.reason === 'Venta' && 'Venta'}
                        {![
                          'Ingreso manual',
                          'Ajuste manual',
                          'Venta'
                        ].includes(movement.reason) && movement.reason}
                      </p>

                      <p className="text-xs text-gray-500">
                        {new Date(movement.created_at).toLocaleDateString(
                          'es-AR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-base font-bold ${
                      movement.change < 0
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {movement.change > 0 ? '+' : ''}
                    {movement.change}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}


</div>
)
}    