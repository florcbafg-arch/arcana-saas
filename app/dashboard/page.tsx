'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

console.log('LOCAL:', new Date())

console.log(
  'ARG:',
  new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Cordoba'
  })
)

console.log(
  'UTC:',
  new Date().toISOString()
)

type RiskCustomer = {
  id: string
  name: string
  debt_amount: number
  credit_limit?: number
}



export default function DashboardHome() {

  const [todaySales, setTodaySales] = useState(0)
  const [yesterdaySales, setYesterdaySales] = useState(0)
  const [salesDiff, setSalesDiff] = useState(0)
  const [salesWarning, setSalesWarning] = useState(false)

  const [highRiskCustomers, setHighRiskCustomers] = useState<RiskCustomer[]>([])

  const [topProduct, setTopProduct] = useState<string | null>(null)
  const [topQuantity, setTopQuantity] = useState(0)

  const [topRevenueProduct, setTopRevenueProduct] = useState<string | null>(null)
  const [topRevenueAmount, setTopRevenueAmount] = useState(0)
  const [topRevenueShare, setTopRevenueShare] = useState(0)
  const [topProfitProduct, setTopProfitProduct] = useState<string | null>(null)
  const [topProfitAmount, setTopProfitAmount] = useState(0)

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [smartInsights, setSmartInsights] = useState<any[]>([])
  const [activeProductsCount, setActiveProductsCount] = useState(0)
  const [alertProductsCount, setAlertProductsCount] = useState(0)
  const [salesTrend, setSalesTrend] = useState<any[]>([])
  const [selectedRange, setSelectedRange] = useState<7 | 30 | 90>(7)

  // ================= VENTAS =================
  const fetchSalesStats = async () => {
    const businessId = localStorage.getItem('activeBusinessId')
    if (!businessId) return

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    const endOfYesterday = new Date(startOfToday)
    endOfYesterday.setMilliseconds(-1)

    const { data: todayData } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('business_id', businessId)
      .gte('created_at', startOfToday.toISOString())

    const { data: yesterdayData } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('business_id', businessId)
      .gte('created_at', startOfYesterday.toISOString())
      .lte('created_at', endOfYesterday.toISOString())

    const todayTotal =
      todayData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

    const yesterdayTotal =
      yesterdayData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

    setTodaySales(todayTotal)
    setYesterdaySales(yesterdayTotal)

    if (yesterdayTotal > 0) {
  let diff = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100

  // 🔹 Limitar porcentaje máximo visible
  if (diff > 999) diff = 999

  setSalesDiff(diff)
  setSalesWarning(diff < -20)
} else {
  // Si ayer fue 0, no mostramos comparación real
  setSalesDiff(0)
  setSalesWarning(false)
}
  }

  // ================= PRODUCTO MÁS VENDIDO =================
  const fetchTopProduct = async () => {
    const businessId = localStorage.getItem('activeBusinessId')
    if (!businessId) return

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const { data: salesToday } = await supabase
      .from('sales')
      .select('id')
      .eq('business_id', businessId)
      .gte('created_at', startOfToday.toISOString())

    if (!salesToday?.length) {
      setTopProduct(null)
      setTopQuantity(0)
      return
    }

    const saleIds = salesToday.map(s => s.id)

    const { data: items } = await supabase
      .from('sale_items')
      .select('product_id, quantity')
      .in('sale_id', saleIds)

    if (!items) return

    const productMap: Record<string, number> = {}

    items.forEach(item => {
      productMap[item.product_id] =
        (productMap[item.product_id] || 0) + item.quantity
    })

    let maxProductId: string | null = null
    let maxQuantity = 0

    for (const productId in productMap) {
      if (productMap[productId] > maxQuantity) {
        maxQuantity = productMap[productId]
        maxProductId = productId
      }
    }

    if (!maxProductId) return

    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', maxProductId)
      .single()

    if (product) {
      setTopProduct(product.name)
      setTopQuantity(maxQuantity)
    }
  }

  // ================= PRODUCTO MÁS FACTURADO =================
  const fetchTopRevenueProduct = async () => {
    const businessId = localStorage.getItem('activeBusinessId')
    if (!businessId) return

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const { data: salesToday } = await supabase
      .from('sales')
      .select('id')
      .eq('business_id', businessId)
      .gte('created_at', startOfToday.toISOString())

    if (!salesToday?.length) {
      setTopRevenueProduct(null)
      setTopRevenueAmount(0)
      setTopRevenueShare(0)
      return
    }

    const saleIds = salesToday.map(s => s.id)

    const { data: items } = await supabase
      .from('sale_items')
      .select('product_id, quantity, price_unit')
      .in('sale_id', saleIds)

    if (!items) return

    const revenueMap: Record<string, number> = {}

    items.forEach(item => {
      const total = item.quantity * item.price_unit
      revenueMap[item.product_id] =
        (revenueMap[item.product_id] || 0) + total
    })

    let maxProductId: string | null = null
    let maxRevenue = 0

    for (const productId in revenueMap) {
      if (revenueMap[productId] > maxRevenue) {
        maxRevenue = revenueMap[productId]
        maxProductId = productId
      }
    }

    if (!maxProductId) return

    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', maxProductId)
      .single()

    if (product) {
      setTopRevenueProduct(product.name)
      setTopRevenueAmount(maxRevenue)

      // Obtener total ventas hoy directamente
const totalToday = Object.values(revenueMap).reduce((acc, val) => acc + val, 0)

if (totalToday > 0) {
  const share = (maxRevenue / totalToday) * 100
  setTopRevenueShare(share)
}
    }
  }

  // ================= PRODUCTO MÁS RENTABLE =================
const fetchTopProfitProduct = async () => {
  const businessId = localStorage.getItem('activeBusinessId')
  if (!businessId) return

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { data: salesToday } = await supabase
    .from('sales')
    .select('id')
    .eq('business_id', businessId)
    .gte('created_at', startOfToday.toISOString())

  if (!salesToday?.length) {
    setTopProfitProduct(null)
    setTopProfitAmount(0)
    return
  }

  const saleIds = salesToday.map(s => s.id)

  const { data: items } = await supabase
    .from('sale_items')
    .select('product_id, quantity, price_unit')
    .in('sale_id', saleIds)

  if (!items?.length) {
    setTopProfitProduct(null)
    setTopProfitAmount(0)
    return
  }

  const productIds = [...new Set(items.map(item => item.product_id))]

  const { data: products } = await supabase
    .from('products')
    .select('id, name, cost_price')
    .in('id', productIds)

  if (!products?.length) return

  const productMap = Object.fromEntries(
    products.map(product => [product.id, product])
  )

  const profitMap: Record<string, number> = {}

  items.forEach(item => {
    const product = productMap[item.product_id]
    if (!product) return

    const margin = Number(item.price_unit || 0) - Number(product.cost_price || 0)
    const profit = margin * Number(item.quantity || 0)

    profitMap[item.product_id] =
      (profitMap[item.product_id] || 0) + profit
  })

  let maxProductId: string | null = null
  let maxProfit = -Infinity

  for (const productId in profitMap) {
    if (profitMap[productId] > maxProfit) {
      maxProfit = profitMap[productId]
      maxProductId = productId
    }
  }

  if (!maxProductId) {
    setTopProfitProduct(null)
    setTopProfitAmount(0)
    return
  }

  setTopProfitProduct(productMap[maxProductId].name)
  setTopProfitAmount(maxProfit)
}

  // ================= ACTIVIDAD RECIENTE =================
  const fetchRecentActivity = async () => {
  const businessId = localStorage.getItem('activeBusinessId')
  if (!businessId) return

  // 🔹 1. Últimas ventas
  const { data: sales } = await supabase
    .from('sales')
    .select('id, total_amount, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(5)

  const salesFormatted =
    sales?.map(s => ({
      type: 'sale',
      priority: 3,
      message: `Venta registrada — $${s.total_amount.toLocaleString()}`,
      created_at: s.created_at
    })) || []

  // 🔹 2. Productos stock
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock_quantity, min_stock_yellow, min_stock_red, active, expiration_date, cost_price')
    .eq('business_id', businessId)

  const stockAlerts = products?.flatMap(p => {
    if (p.stock_quantity <= p.min_stock_red) {
      return [{
        type: 'critical',
        priority: 1,
        message: `${p.name} en nivel crítico (quedan ${p.stock_quantity})`,
        created_at: new Date().toISOString()
      }]
    }

    if (p.stock_quantity <= p.min_stock_yellow) {
      return [{
        type: 'warning',
        priority: 2,
        message: `${p.name} con stock bajo (quedan ${p.stock_quantity})`,
        created_at: new Date().toISOString()
      }]
    }

    return []
  }) || []

  const today = new Date()
today.setHours(0, 0, 0, 0)

const expirationAlerts =
  products?.flatMap(product => {
    if (!product.expiration_date) return []

    const [year, month, day] =
      product.expiration_date.split('-').map(Number)

    const expiration = new Date(year, month - 1, day)

    expiration.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil(
      (expiration.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
    )

    if (diffDays < 0) {
      return [{
        type: 'critical',
        priority: 1,
        message: `⛔ ${product.name} está vencido`,
        created_at: new Date().toISOString()
      }]
    }

    if (diffDays === 0) {
      return [{
        type: 'critical',
        priority: 1,
        message: `🚨 ${product.name} vence hoy`,
        created_at: new Date().toISOString()
      }]
    }

    if (diffDays <= 7) {
      return [{
        type: 'warning',
        priority: 2,
        message: `⚠️ ${product.name} vence en ${diffDays} días`,
        created_at: new Date().toISOString()
      }]
    }

    return []
  }) || []

  const insights = []

if (topProduct && topQuantity > 0) {
  insights.push({
    type: 'insight',
    priority: 2,
    message: `🔥 ${topProduct} fue el producto más vendido hoy (${topQuantity} ventas)`,
    created_at: new Date().toISOString()
  })
}

if (topRevenueProduct && topRevenueAmount > 0) {
  insights.push({
    type: 'insight',
    priority: 2,
    message: `💰 ${topRevenueProduct} fue el producto que más facturó hoy ($${topRevenueAmount.toLocaleString()})`,
    created_at: new Date().toISOString()
  })
}

if (topProfitProduct && topProfitAmount > 0) {
  insights.push({
    type: 'insight',
    priority: 2,
    message: `💎 ${topProfitProduct} dejó la mayor ganancia estimada hoy ($${topProfitAmount.toLocaleString('es-AR')})`,
    created_at: new Date().toISOString()
  })
}

// 🔹 3. Productos sin movimiento en últimos 15 días
const fifteenDaysAgo = new Date()
fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

const { data: recentSales } = await supabase
  .from('sales')
  .select('id')
  .eq('business_id', businessId)
  .gte('created_at', fifteenDaysAgo.toISOString())

let slowProducts: any[] = []

if (recentSales?.length) {
  const saleIds = recentSales.map(s => s.id)

  const { data: recentItems } = await supabase
    .from('sale_items')
    .select('product_id')
    .in('sale_id', saleIds)

  const soldProductIds = new Set(
    recentItems?.map(item => item.product_id) || []
  )

  slowProducts =
    products
      ?.filter(p =>
  p.active &&
  p.stock_quantity > 0 &&
  !soldProductIds.has(p.id)
)
      .slice(0, 3)
     .map(p => {
  const stockValue =
    Number(p.stock_quantity || 0) *
    Number(p.cost_price || 0)

  return {
    type: 'critical',
    priority: 2,
    message: `🛑 ${p.name} lleva 15 días sin venderse. Tenés $${stockValue.toLocaleString('es-AR')} inmovilizados.`,
    created_at: new Date().toISOString()
  }
}) || []
}

  // 🔹 3. Combinar y ordenar por prioridad + fecha
  const combined = [
  ...expirationAlerts,
  ...stockAlerts,
  ...slowProducts,
  ...insights,
  ...salesFormatted
]
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, 6)

  setRecentActivity(combined)
}
  
  // ================= CLIENTES RIESGO =================
  const fetchHighRiskCustomers = async () => {
    const businessId = localStorage.getItem('activeBusinessId')
    if (!businessId) return []

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)

    if (!data) return []

    return data.filter(
      c =>
        c.credit_limit &&
        c.credit_limit > 0 &&
        c.debt_amount >= c.credit_limit
    )
  }

  // ================= PRODUCTOS STATS =================
const fetchProductsStats = async () => {
  const businessId = localStorage.getItem('activeBusinessId')
  if (!businessId) return

  const { data: products } = await supabase
    .from('products')
    .select('id, stock_quantity, min_stock_yellow, active')
    .eq('business_id', businessId)

  if (!products) return

  // Productos activos
  const active = products.filter(p => p.active).length
  setActiveProductsCount(active)

  // Productos en alerta
  const alert = products.filter(
    p => p.stock_quantity <= p.min_stock_yellow
  ).length

  setAlertProductsCount(alert)
}

const fetchSalesTrend = async (days: 7 | 30 | 90) => {
  const businessId = localStorage.getItem('activeBusinessId')
  if (!businessId) return

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data } = await supabase
    .from('sales')
    .select('total_amount, created_at')
    .eq('business_id', businessId)
    .gte('created_at', startDate.toISOString())

  if (!data) return

  const grouped: Record<string, number> = {}

  data.forEach(sale => {
    const date = new Date(sale.created_at).toLocaleDateString()
    grouped[date] =
      (grouped[date] || 0) + Number(sale.total_amount)
  })

  const formatted = Object.keys(grouped).map(date => ({
    date,
    total: grouped[date]
  }))

  formatted.sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  )

  setSalesTrend(formatted)
}

  // ================= LOAD DASHBOARD =================
  useEffect(() => {
  const loadDashboard = async () => {
    await fetchSalesStats()
    await fetchTopProduct()
    await fetchTopRevenueProduct()
    await fetchTopProfitProduct()
    await fetchRecentActivity()
    await fetchProductsStats()

    const risky = await fetchHighRiskCustomers()
    setHighRiskCustomers(risky)
  }

  loadDashboard()

  const interval = setInterval(() => {
    loadDashboard()
  }, 5000) // 🔥 cada 5 segundos

  return () => clearInterval(interval)
}, [])

useEffect(() => {
  fetchSalesTrend(selectedRange)
}, [selectedRange])

const formatRelativeTime = (dateString: string) => {

  const now = new Date()
  const date = new Date(dateString)

  const diffMs = now.getTime() - date.getTime()

  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffMinutes < 1) {
    return 'Ahora'
  }

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`
  }

  if (diffHours < 24) {
    return `Hace ${diffHours}h`
  }

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit'
  })
}

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          📊 Panel principal
        </h1>
        <p className="text-gray-400 mt-1">
          Resumen general de tu negocio.
        </p>

        {/* SELECTOR */}
<div className="flex flex-wrap gap-2 mt-4">
  {[7, 30, 90].map((range) => (
    <button
      key={range}
      onClick={() => setSelectedRange(range as 7 | 30 | 90)}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
        selectedRange === range
          ? 'bg-[#1F6BFF] text-white'
          : 'bg-[#0F0F14] text-gray-400'
      }`}
    >
      {range}D
    </button>
  ))}
</div>

{/* MINI GRÁFICO */}
<div className="h-20 mt-4">
  {salesTrend.length < 2 ? (
    <div className="flex items-center justify-center h-full text-xs text-gray-500">
      Sin datos suficientes
    </div>
  ) : (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={salesTrend}>
        <Tooltip
          contentStyle={{
            backgroundColor: '#111117',
            border: '1px solid rgba(31,107,255,0.4)',
            borderRadius: '14px',
            boxShadow: '0 0 20px rgba(31,107,255,0.15)'
          }}
          labelStyle={{
            color: '#FFFFFF',
            fontWeight: 600
          }}
          itemStyle={{
            color: '#1F6BFF',
            fontWeight: 700
          }}
          formatter={(value: any) =>
            `$${Number(value).toLocaleString()}`
          }
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#1F6BFF"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )}
</div>

        {salesWarning && (
  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
    ⚠️ Tus ventas bajaron más de un 20% respecto a ayer. 
    Revisá promociones, stock o precios.
  </div>
)}
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

       <div
  className={`bg-[#14141A] border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
    salesDiff > 0
      ? 'border-green-500/40'
      : salesDiff < 0
      ? 'border-red-500/40'
      : 'border-[#1F1F24]'
  }`}
>
          <p className="text-gray-400 text-sm">Ventas del día</p>
          <p className="text-3xl md:text-4xl semibold text-yellow-400 mt-3">
  ${todaySales.toLocaleString()}
</p>

<p className={`text-2xl font-bold mt-3 ${
  salesDiff >= 0 ? 'text-green-400' : 'text-red-400'
}`}>

 {yesterdaySales > 0 ? (
  <>
    {salesDiff >= 0 ? '+' : ''}
    {salesDiff.toFixed(1)}% vs ayer
  </>
) : (
  <span className="text-gray-400 text-sm">
    Sin comparación (sin ventas ayer)
  </span>
)}
</p>
        </div>

        <div className="bg-[#14141A] border border-[#2A2A33] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <p className="text-gray-400 text-sm">Productos activos</p>
         <p className="text-3xl md:text-4xl font-bold text-white mt-3">
  {activeProductsCount}
</p>
        </div>

        <div className="bg-[#14141A] border border-[#2A2A33] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <p className="text-gray-400 text-sm">En alerta</p>
          <p className="text-3xl md:text-4xl font-semibold text-yellow-400 mt-3 tracking-tight">
            {alertProductsCount}
          </p>
        </div>

        <div className="bg-[#14141A] border border-[#2A2A33] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <p className="text-gray-400 text-sm">Clientes en riesgo</p>
<p className="text-3xl md:text-4xl font-bold text-red-400 mt-3">
  {highRiskCustomers.length}
</p>
        </div>

      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ACTIVIDAD RECIENTE */}
        <div className="lg:col-span-2 bg-[#14141A] border border-[#2A2A33] rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-medium">
            Actividad reciente
          </h2>
<div className="space-y-3">

  {recentActivity.length === 0 ? (
    <p className="text-gray-400 text-sm font-medium">
      Sin actividad reciente.
    </p>
  ) : (
    recentActivity.map((item, index) => (
      <div
        key={index}
       className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-[#111117] border border-[#1F1F24] p-4 rounded-xl transition-all duration-200 hover:border-[#2A2A33]"
      >
        <div className="flex items-center gap-3">

          {/* Indicador visual más fuerte */}
          <div
            className={`w-3 h-3 rounded-full ${
              item.type === 'critical'
  ? 'bg-red-500'
  : item.type === 'warning'
  ? 'bg-yellow-400'
  : item.type === 'insight'
  ? 'bg-blue-500'
  : 'bg-green-500'
            }`}
          />

          {/* Mensaje con color fuerte */}
          <p
            className={`text-sm font-semibold ${
              item.type === 'critical'
  ? 'text-red-400'
  : item.type === 'warning'
  ? 'text-yellow-400'
  : item.type === 'insight'
  ? 'text-blue-400'
  : 'text-white'
            }`}
          >
            {item.message}
          </p>

        </div>

        {/* Hora más visible */}
        <span className="text-gray-300 text-sm font-medium self-start sm:self-auto">
          {formatRelativeTime(item.created_at)}
        </span>
      </div>
    ))
  )}

</div>
     
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">

  {/* SITUACIONES CRÍTICAS */}
  <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6 space-y-4">
    <h2 className="text-white font-medium">
      Situaciones críticas
    </h2>

    <div className="space-y-3">

      {highRiskCustomers.length === 0 && (
        <div className="bg-[#0F0F14] p-4 rounded-xl border border-green-500/20">
          <p className="text-green-400 font-medium">
            ✔️ Sin clientes en riesgo
          </p>
        </div>
      )}

    </div>
  </div>

  {/* PRODUCTO ESTRELLA POR CANTIDAD */}
  <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6">
    <h2 className="text-white font-medium mb-4">
      🔥 Producto estrella del día
    </h2>

    <div className="bg-[#0F0F14] p-4 rounded-xl">
      {topProduct ? (
        <>
          <p className="text-white font-medium">
            {topProduct}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {topQuantity} ventas registradas hoy.
          </p>
        </>
      ) : (
        <p className="text-gray-400 text-sm">
          Sin ventas registradas hoy.
        </p>
      )}
    </div>
  </div>

  {/* PRODUCTO MÁS FACTURADO */}
  <div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6">
    <h2 className="text-white font-medium mb-4">
      💰 Producto que más facturó hoy
    </h2>


    <div className="bg-[#0F0F14] p-4 rounded-xl">
      {topRevenueProduct ? (
        <>
          <p className="text-white font-medium">
            {topRevenueProduct}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            ${topRevenueAmount.toLocaleString()} facturados hoy.
          </p>

{topRevenueShare > 0 && (
  <p className={`text-xs mt-2 ${
    topRevenueShare > 50 ? 'text-yellow-400' : 'text-green-400'
  }`}>
    Representa el {topRevenueShare.toFixed(1)}% de tus ventas de hoy.
  </p>
)}
        </>
      ) : (
        <p className="text-gray-400 text-sm">
          Sin facturación registrada hoy.
        </p>
      )}
    </div>
  </div>

{/* PRODUCTO MÁS RENTABLE */}
<div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6">
  <h2 className="text-white font-medium mb-4">
    💎 Producto más rentable hoy
  </h2>

  <div className="bg-[#0F0F14] p-4 rounded-xl">
    {topProfitProduct ? (
      <>
        <p className="text-white font-medium">
          {topProfitProduct}
        </p>

        <p className={`text-sm mt-1 ${
          topProfitAmount < 0 ? 'text-red-400' : 'text-green-400'
        }`}>
          ${topProfitAmount.toLocaleString('es-AR')} de ganancia estimada hoy.
        </p>

        {topProfitAmount < 0 && (
          <p className="text-xs text-red-400 mt-2">
            ⚠️ Este producto vendió, pero dejó pérdida.
          </p>
        )}
      </>
    ) : (
      <p className="text-gray-400 text-sm">
        Sin rentabilidad registrada hoy.
      </p>
    )}
  </div>
</div>

</div>

      </div>

{highRiskCustomers.map((c) => (
  <div
    key={c.id}
    className="bg-[#0F0F14] p-4 rounded-xl border border-red-500/20"
  >
    <p className="text-red-400 font-medium">
      💳 {c.name} superó su límite
    </p>
    <p className="text-gray-400 text-sm mt-1">
      Debe ${c.debt_amount} de ${c.credit_limit}
    </p>
  </div>
))}
      </div>
  )
}
