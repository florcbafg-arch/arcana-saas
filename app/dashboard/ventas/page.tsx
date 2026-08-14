'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion"
import { useRef } from 'react'
import BarcodeScanner from "../components/BarcodeScanner"
import FloatingToast from "../components/FloatingToast"


type Product = {
  id: string
  name: string
  stock_quantity: number
  price: number
  unit: string
  code?: string
  barcode?: string
  sale_type?: 'unit' | 'weight'
  unit_base?: 'unit' | 'kg' | 'g'
  price_by?: 'unit' | 'kg' | '100g'
  quantity_label?: string
  sale_quantity_kg?: number
  final_price?: number

  // Datos visuales del producto
  image_url?: string | null
  brand?: string | null
  category?: string | null
  quantity?: string | null
}

type Customer = {
  id: string
  name: string
  business_id: string
  debt_amount: number
  credit_limit?: number
}


export default function VentasPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [successFlash, setSuccessFlash] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const [business, setBusiness] = useState<any | null>(null)
  const [lastSaleTicket, setLastSaleTicket] = useState<any | null>(null)
  const [showTicket, setShowTicket] = useState(false)
  const [weightGrams, setWeightGrams] = useState('')

  const [saleQuantity, setSaleQuantity] = useState('')
  const [creating, setCreating] = useState(false)
  const [salePaid, setSalePaid] = useState(true)
  const [paymentType, setPaymentType] = useState("cash")
  const [sales, setSales] = useState<any[]>([])
  const [selectedRecentSale, setSelectedRecentSale] = useState<any | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [scannerActive, setScannerActive] = useState(true)
  const scannerRef = useRef<HTMLInputElement | null>(null)
  const lastScanRef = useRef<number>(0)
  const [showScanner,setShowScanner] = useState(false)
  const beep = () => {
  const audio = new Audio("/beep.mp3")
  audio.play()
}
const [toast, setToast] = useState<{
  type: "success" | "error" | "warning"
  message: string
} | null>(null)
const [salesSummary, setSalesSummary] = useState({
  total: 0,
  count: 0,
  units: 0,
  weightKg: 0,
  debt: 0
})

  // Obtener negocio activo
  useEffect(() => {
    const id = localStorage.getItem('activeBusinessId')
    setSelectedBusinessId(id)
  }, [])

  // Cargar productos y clientes cuando haya negocio
 useEffect(() => {
  if (!selectedBusinessId) return
  fetchProducts()
  fetchCustomers()
  fetchSales()
  fetchBusiness()
}, [selectedBusinessId])

  useEffect(() => {
  if (!toast) return

  const timer = setTimeout(() => {
    setToast(null)
  }, 2500)

  return () => clearTimeout(timer)
}, [toast])

useEffect(() => {
  scannerRef.current?.focus()
}, [])

  const fetchProducts = async () => {
  if (!selectedBusinessId) return

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', selectedBusinessId)
    .eq('active', true)

  if (error) {
    console.error(
      'Error cargando productos activos:',
      error
    )
    return
  }

  setProducts(data || [])
}

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', selectedBusinessId)

    setCustomers(data || [])
  }

  const fetchSales = async () => {
  if (!selectedBusinessId) return

  const { data } = await supabase
    .from('sales')
    .select(`
      *,
      customers ( name ),
      sale_items (
        quantity,
        price_unit,
        products ( name, unit, sale_type )
      )
    `)
    .eq('business_id', selectedBusinessId)
    .order('created_at', { ascending: false })

  setSales(data || [])
calculateSummary(data || [])
}

const fetchBusiness = async () => {
  if (!selectedBusinessId) return

  const { data } = await supabase
    .from('businesses')
    .select('name, logo_url')
    .eq('id', selectedBusinessId)
    .single()

  setBusiness(data)
}

const calculateSummary = (salesData: any[]) => {
  let total = 0
  let count = 0
  let units = 0
  let weightKg = 0
  let debt = 0

  const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires'
})

const todaySales = salesData.filter((sale) => {
  const saleDate = new Date(sale.created_at).toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  return saleDate === today
})

todaySales.forEach(sale => {
    total += sale.total_amount
    count += 1

    if (sale.payment_method === "debt") {
      debt += sale.total_amount
    }

    sale.sale_items?.forEach((item: any) => {
  if (item.products?.sale_type === 'weight') {
    weightKg += Number(item.quantity || 0)
  } else {
    units += Number(item.quantity || 0)
  }
})
  })

  setSalesSummary({
    total,
    count,
    units,
    weightKg,
    debt
  })
}

const createSale = async (productFromScanner?: Product) => {
  if (creating) return
  if (!selectedBusinessId) return

  const product = productFromScanner || selectedProduct

if (!product) {
    setToast({ type: "error", message: "Seleccioná un producto" })
    return
  }

  const quantity = Number(saleQuantity)

if (!quantity || quantity <= 0) {
    setToast({ type: "error", message: "Cantidad inválida" })
    return
  }

  if (!salePaid && !selectedCustomer) {
    setToast({ type: "error", message: "Seleccioná un cliente para venta fiada" })
    return
  }

  setCreating(true)

  const { data: saleId, error } = await supabase.rpc(
    "create_sale_atomic",
    {
      p_business_id: selectedBusinessId,
      p_product_id: product.id,
      p_quantity: saleQuantity,
      p_customer_id: salePaid ? null : selectedCustomer?.id,
      p_payment_method: salePaid ? "paid" : "debt",
    }
  )

  if (error) {
    setToast({ type: "error", message: error.message })
    setCreating(false)
    return
  }


  await fetchProducts()
  await fetchSales()
  if (sales.length === 0) {
  setToast({
    type: "success",
    message: "🎉 ¡Primera venta registrada! Bienvenida a Arcana."
  })
}

  setSaleQuantity('')
  setSelectedProduct(null)
  setSelectedCustomer(null)
  setSalePaid(true)

  setToast({
    type: "success",
    message: `Venta #${saleId.slice(0, 6)} registrada correctamente`
  })

  setSuccessFlash(true)
  setTimeout(() => setSuccessFlash(false), 800)

  setTimeout(() => {
    salesRef.current?.scrollIntoView({ behavior: "smooth" })
  }, 200)

  setCreating(false)
}

const addProductToCart = (product: Product, quantity = 1) => {
  if (quantity <= 0) {
    setToast({ type: "error", message: "Cantidad inválida" })
    return
  }

  const isWeightProduct = product.sale_type === 'weight'

  setCart(prev => {
    const existing = prev.find(p => p.product_id === product.id)
    const currentQty = existing?.quantity || 0
    const newQty = currentQty + quantity

    if (product.stock_quantity < newQty) {
      setToast({ type: "error", message: "Stock insuficiente en carrito" })
      return prev
    }

    if (existing) {
      return prev.map(p =>
        p.product_id === product.id
          ? {
              ...p,
              quantity: newQty,
              quantity_label: isWeightProduct
                ? `${Math.round(newQty * 1000)}g`
                : undefined
            }
          : p
      )
    }

    setLastAddedId(product.id)
    setTimeout(() => setLastAddedId(null), 600)

   return [
  ...prev,
  {
    product_id: product.id,
    name: product.name,
    quantity,
    price: product.price,
    unit: product.unit,
    sale_type: product.sale_type,
    unit_base: product.unit_base,
    price_by: product.price_by,

    image_url: product.image_url || null,
    brand: product.brand || null,
    category: product.category || null,
    product_quantity: product.quantity || null,

    quantity_label: isWeightProduct
      ? product.quantity_label || `${Math.round(quantity * 1000)}g`
      : undefined
  }
]
  })
}

const addToCart = () => {
  if (!selectedProduct) return

  const isWeightProduct = selectedProduct.sale_type === 'weight'

  if (isWeightProduct) {
  const grams = Number(weightGrams)
  const quantityKg = grams / 1000

  if (!grams || grams <= 0) {
    setToast({ type: "error", message: "Ingresá los gramos a vender" })
    return
  }

  if (selectedProduct.stock_quantity < quantityKg) {
    setToast({ type: "error", message: "Stock insuficiente" })
    return
  }

  const pricePerKg =
    selectedProduct.price_by === '100g'
      ? selectedProduct.price * 10
      : selectedProduct.price

  addProductToCart(
    {
      ...selectedProduct,
      price: pricePerKg,
      quantity_label: `${grams}g`,
      sale_quantity_kg: quantityKg,
      final_price: pricePerKg * quantityKg
    },
    quantityKg
  )

  setSelectedProduct(null)
  setSaleQuantity('')
  setWeightGrams('')
  setProductSearch('')
  return
}

  const quantity = Number(saleQuantity)

if (!quantity || quantity <= 0) {
    setToast({ type: "error", message: "Cantidad inválida" })
    return
  }

 if (selectedProduct.stock_quantity < quantity) {
    setToast({ type: "error", message: "Stock insuficiente" })
    return
  }

 addProductToCart(selectedProduct, quantity)

  setSelectedProduct(null)
  setSaleQuantity('')
  setWeightGrams('')
  setProductSearch('')
}

const cartTotal = cart.reduce(
  (acc, item) => acc + item.quantity * item.price,
  0
)

const createCartSale = async () => {
  if (cart.length === 0) {
    setToast({ type: "error", message: "El carrito está vacío" })
    return
  }

  if (!selectedBusinessId) return

  setCreating(true)

  const { data, error } = await supabase.rpc(
    "create_sale_cart_atomic",
    {
      p_business_id: selectedBusinessId,
      p_user_id: null, // después lo mejoramos
      p_items: cart,
      p_customer_id: salePaid ? null : selectedCustomer?.id,
      p_payment_method: salePaid ? "paid" : "debt",
      p_payment_type: salePaid ? paymentType : null
    }
  )

  if (error) {
    setToast({ type: "error", message: error.message })
    setCreating(false)
    return
  }

  await fetchProducts()
  await fetchSales()

  setLastSaleTicket({
  businessName: business?.name || "Comercio",
  saleId: data,
  date: new Date(),
  items: cart,
  total: cartTotal,
  units: cart
  .filter((item) => item.sale_type !== 'weight')
  .reduce((acc, item) => acc + Number(item.quantity || 0), 0),

weightLabel: cart.some((item) => item.sale_type === 'weight')
  ? `${Math.round(
      cart
        .filter((item) => item.sale_type === 'weight')
        .reduce((acc, item) => acc + Number(item.quantity || 0), 0) * 1000
    )}g`
  : null,
  customer: salePaid ? "Consumidor final" : selectedCustomer?.name || "Cliente",
  paymentMethod: salePaid ? "Pago" : "Fiado",
  paymentType: paymentType
})

setShowTicket(true)

  setCart([])
  setToast({
    type: "success",
    message: "Venta con carrito registrada 🚀"
  })

  setCreating(false)
}

const salesRef = useRef<HTMLDivElement | null>(null)

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && creating) {
    e.preventDefault()
  }
}

const handleScanner = async (e: React.KeyboardEvent<HTMLInputElement>) => {

  const now = Date.now()

if (now - lastScanRef.current < 1000) return

lastScanRef.current = now


  if (e.key !== "Enter") return

  const input = e.target as HTMLInputElement
const code = input.value.trim()
input.value = ""

scannerRef.current?.focus()

  if (!code) return

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .or(`barcode.eq.${code},code.eq.${code}`)
    .eq("business_id", selectedBusinessId)
    .eq("active", true)
    .single()

  if (!product) {
    setToast({
      type: "error",
      message: "Producto no encontrado"
    })
    return
  }

  if (product.stock_quantity <= 0) {
  setToast({
    type: "error",
    message: "Producto sin stock"
  })

  input.value = ""
  scannerRef.current?.focus()

  return
}


  beep()

 addProductToCart(product, 1)

setToast({
  type: "success",
  message: `${product.name} agregado al carrito`
})

  ;(e.target as HTMLInputElement).value = ""
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(value)
}

const getSaleDateLabel = (createdAt: string) => {
  const saleDate = new Date(createdAt)

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const saleDay = saleDate.toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const time = saleDate.toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit'
  })

  if (saleDay === today) {
    return `Hoy · ${time}`
  }

  return `${saleDate.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })} · ${time}`
}

const getSaleDayKey = (createdAt: string) => {
  return new Date(createdAt).toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })
}

const getSaleDayLabel = (createdAt: string) => {
  const saleDate = new Date(createdAt)

  const today = new Date()

  const todayKey = today.toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const yesterdayKey = yesterday.toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const saleKey = getSaleDayKey(createdAt)

  if (saleKey === todayKey) {
    return 'Hoy'
  }

  if (saleKey === yesterdayKey) {
    return 'Ayer'
  }

  return saleDate
    .toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: 'short'
    })
    .replace('.', '')
}

const groupedSales = sales.reduce(
  (groups: Record<string, any[]>, sale) => {
    const key = getSaleDayKey(sale.created_at)

    if (!groups[key]) {
      groups[key] = []
    }

    groups[key].push(sale)

    return groups
  },
  {}
)

const printTicket = () => {
  window.print()
}

const filteredProducts = products.filter((product) => {
  const search = productSearch.trim().toLowerCase()

  if (!search) return false

  return (
    product.name.toLowerCase().includes(search) ||
    (product.code || '').toLowerCase().includes(search) ||
    (product.barcode || '').toLowerCase().includes(search)
  )
})

  return (
     <div
  className="space-y-8 w-full text-white"
  onKeyDown={handleKeyDown}
>

<input
  ref={scannerRef}
  type="text"
  onKeyDown={handleScanner}
  className="absolute opacity-0 pointer-events-none"
/>

<FloatingToast
  toast={toast}
  onClose={() => setToast(null)}
/>

{selectedProduct && selectedProduct.stock_quantity <= 5 && (
  <div className="mb-6 p-4 rounded-xl border border-red-700 bg-red-950 text-red-400 flex justify-between items-center animate-pulse">
    <span>
      ⚠️ Stock crítico para {selectedProduct.name}
    </span>

    <button
      onClick={() => router.push('/dashboard/stock')}
      className="text-sm bg-red-800 px-3 py-1 rounded-lg hover:bg-red-700 transition"
    >
      Ver stock
    </button>
  </div>
)}


      {/* HEADER */}
<div className="flex items-center gap-4">

  {/* ICONO GRANDE */}
  <div className="text-4xl md:text-5xl drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
  🛒
</div>

  {/* TEXTO */}
  <div>
    <h1 className="text-3xl md:text-4xl font-semibold">
      Nueva Venta
    </h1>

    <p className="text-gray-400 text-sm">
      Flujo rápido de ventas tipo POS
    </p>
  </div>

</div>

{/* RESUMEN CAJA */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">

  <div className="bg-[#14141A] border border-[#2A2A32] rounded-xl p-4">
    <p className="text-xs text-gray-400">Caja de hoy</p>
    <motion.p
  key={salesSummary.total}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="text-lg font-semibold text-green-400"
>
  {formatCurrency(salesSummary.total)}
</motion.p>
    
  </div>

  <div className="bg-[#14141A] border border-[#2A2A32] rounded-xl p-4">
    <p className="text-xs text-gray-400">Ventas</p>
    <motion.p
  key={salesSummary.count}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="text-lg font-semibold"
>
  {salesSummary.count}
</motion.p>
  </div>

  <div className="bg-[#14141A] border border-[#2A2A32] rounded-xl p-4">
    <p className="text-xs text-gray-400">Unidades</p>
  <motion.div
  key={`${salesSummary.units}-${salesSummary.weightKg}`}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="space-y-1"
>
  <p className="text-lg font-semibold">
    {salesSummary.units} un
  </p>

  {salesSummary.weightKg > 0 && (
    <p className="text-xs text-cyan-400">
      {salesSummary.weightKg.toFixed(2)} kg vendidos
    </p>
  )}
</motion.div>
  </div>



</div>

{/* SCANNER BAR */}
<div className="bg-[#14141A] border border-[#2A2A32] rounded-2xl p-4 space-y-3">

  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 text-sm text-gray-400">
      <span>Scanner</span>

      <div
        className={`w-4 h-4 rounded-full ${
          scannerActive ? "bg-green-500" : "bg-gray-600"
        }`}
      />

      <span className="text-xs text-green-400">
        Listo
      </span>
    </div>

    <span className="text-xs text-green-400">
      Escaneá un producto...
    </span>
  </div>

  <div className="flex flex-col md:flex-row gap-3">
    <input
      ref={scannerRef}
      type="text"
      placeholder="🔍 Escanear o escribir código..."
      onKeyDown={handleScanner}
      className="flex-1 bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40"
    />

    <button
      type="button"
      onClick={() => setShowScanner(true)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl"
    >
      📷 Cámara
    </button>
  </div>
</div>

{showScanner && (
  <div
    className="
      fixed
      inset-0
      z-[2500]
      bg-[#08080D]
      flex
      flex-col
    "
  >

    {/* HEADER SCANNER */}
    <div
      className="
        shrink-0
        flex
        items-center
        justify-between
        gap-4
        px-5
        py-4
        border-b
        border-[#25252D]
        bg-[#0B0B10]
      "
    >

      <div>

        <h2 className="text-lg font-semibold text-white">
          📷 Escanear producto
        </h2>

        <p className="text-xs text-gray-400 mt-1">
          Apuntá al código de barras del producto.
        </p>

      </div>


      <button
        type="button"
        onClick={() => setShowScanner(false)}
        className="
          w-10
          h-10
          rounded-xl
          bg-[#181820]
          border
          border-[#2A2A32]
          text-xl
          text-gray-300
          hover:text-white
          flex
          items-center
          justify-center
        "
      >
        ✕
      </button>

    </div>


    {/* CÁMARA FULLSCREEN */}
    <div
      className="
        flex-1
        min-h-0
        p-4
        md:p-6
      "
    >

      <div
        className="
          h-full
          w-full
          max-w-3xl
          mx-auto
        "
      >

        <BarcodeScanner
          onScan={(code) => {

            const product = products.find(
              (p) =>
                p.code === code ||
                p.barcode === code
            )

            if (!product) {
              setToast({
                type: "error",
                message:
                  "Producto no encontrado en tu catálogo"
              })

              setShowScanner(false)

              return
            }

            if (
              Number(product.stock_quantity) <= 0
            ) {
              setToast({
                type: "error",
                message:
                  `${product.name} no tiene stock disponible`
              })

              setShowScanner(false)

              return
            }

            addProductToCart(
              product,
              1
            )

            setToast({
              type: "success",
              message:
                `${product.name} agregado al carrito`
            })

            // El componente ya hace beep/vibración.
            // Cerramos inmediatamente la cámara.
            setShowScanner(false)
          }}
        />

      </div>

    </div>


    {/* AYUDA */}
    <div
      className="
        shrink-0
        px-5
        py-4
        border-t
        border-[#25252D]
        bg-[#0B0B10]
        text-center
      "
    >

      <p className="text-xs text-gray-400">
        Arcana agregará una unidad al carrito y cerrará la cámara automáticamente.
      </p>

    </div>

  </div>
)}

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] gap-6 w-full">

        {/* PANEL IZQUIERDO */}
       
       <div className="bg-[#14141A] border border-[#2A2A32] rounded-2xl p-6 space-y-5 
transition-all duration-300 hover:border-[#3B3B44] hover:shadow-xl">

          <h2 className="text-lg font-medium">Registrar venta</h2>

          {/* Producto */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Producto</label>
            <input
  type="text"
  value={productSearch}
  onChange={(e) => {
    setProductSearch(e.target.value)
    setSelectedProduct(null)
  }}
  placeholder="Buscar producto..."
  className="w-full bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3 text-white"
/>

{productSearch && !selectedProduct && (
  <div className="bg-[#0F0F14] border border-[#2A2A32] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
    {filteredProducts.length === 0 ? (
      <p className="p-3 text-sm text-gray-400">
        No se encontraron productos
      </p>
    ) : (
      filteredProducts.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => {
            setSelectedProduct(product)
            setProductSearch(product.name)
          }}
          className="w-full text-left p-3 hover:bg-[#1A1A22] transition border-b border-[#2A2A32] last:border-b-0"
        >
          <p className="text-sm font-medium text-white">
            {product.name}
          </p>
          <p className="text-xs text-gray-400">
            Stock: {product.stock_quantity} {product.unit} · {formatCurrency(product.price)}
          </p>
        </button>
      ))
    )}
  </div>
)}
          </div>

{/* PRODUCTO SELECCIONADO */}
{selectedProduct && (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="
      bg-[#0B0B10]
      border border-[#1F6BFF]/60
      rounded-2xl
      p-4
      shadow-[0_0_25px_rgba(31,107,255,0.08)]
    "
  >

    <div className="flex gap-4">

      {/* IMAGEN */}
      <div
        className="
          w-28 h-28
          shrink-0
          rounded-xl
          bg-white
          overflow-hidden
          flex items-center justify-center
        "
      >

        {selectedProduct.image_url ? (
          <img
            src={selectedProduct.image_url}
            alt={selectedProduct.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full bg-[#17171F] flex flex-col items-center justify-center text-gray-500">
            <span className="text-3xl">
              📦
            </span>

            <span className="text-[10px] mt-2">
              Sin imagen
            </span>
          </div>
        )}

      </div>


      {/* INFORMACIÓN */}
      <div className="flex-1 min-w-0">

        <div className="flex items-start justify-between gap-2">

          <div className="min-w-0">

            <p className="text-base font-semibold text-white leading-tight">
              {selectedProduct.name}
            </p>

            {(selectedProduct.brand || selectedProduct.quantity) && (
              <p className="text-xs text-gray-400 mt-1">
                {selectedProduct.brand && (
                  <>
                    {selectedProduct.brand}
                  </>
                )}

                {selectedProduct.brand &&
                  selectedProduct.quantity && (
                    <span> · </span>
                  )}

                {selectedProduct.quantity}
              </p>
            )}

          </div>


          <span
            className="
              shrink-0
              text-[10px]
              px-2 py-1
              rounded-full
              bg-green-500/10
              border border-green-500/20
              text-green-400
              font-medium
            "
          >
            Disponible
          </span>

        </div>


        {/* PRECIO */}
        <div className="mt-3">

          <p className="text-xl font-bold text-green-400">
            {formatCurrency(selectedProduct.price)}
          </p>

          <p className="text-xs text-gray-500">
            {selectedProduct.sale_type === 'weight'
              ? selectedProduct.price_by === '100g'
                ? 'por 100 gramos'
                : 'por kilo'
              : `por ${selectedProduct.unit || 'unidad'}`}
          </p>

        </div>


        {/* STOCK */}
        <div className="mt-3 flex flex-wrap gap-2">

          <span
            className="
              text-xs
              px-2.5 py-1
              rounded-lg
              bg-green-500/10
              text-green-400
              border border-green-500/20
            "
          >
            Stock: {selectedProduct.stock_quantity}{' '}
            {selectedProduct.sale_type === 'weight'
              ? 'kg'
              : selectedProduct.unit}
          </span>

          {selectedProduct.code && (
            <span
              className="
                text-xs
                px-2.5 py-1
                rounded-lg
                bg-[#17171F]
                text-gray-400
                border border-[#2A2A32]
              "
            >
              {selectedProduct.code}
            </span>
          )}

        </div>

      </div>

    </div>


    {/* CONFIRMACIÓN ARCANA */}
    <div
      className="
        mt-4
        pt-3
        border-t border-[#25252D]
        flex items-center gap-2
      "
    >

      <div
        className="
          w-6 h-6
          rounded-lg
          bg-green-500/10
          flex items-center justify-center
          text-green-400
          text-xs
        "
      >
        ✓
      </div>

      <p className="text-xs text-gray-400">
        Producto seleccionado y listo para agregar al carrito.
      </p>

    </div>

  </motion.div>
)}

         {/* Cantidad */}
<div className="space-y-2">

  {selectedProduct?.sale_type === 'weight' ? (
    <>
      <label className="text-sm text-gray-400">
        Cantidad en gramos
      </label>

      <input
        type="number"
        min={1}
        value={weightGrams}
        onChange={(e) => setWeightGrams(e.target.value)}
        placeholder="Ej: 100"
        className="w-full bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3 text-white"
      />

      {weightGrams && (
        <p className="text-xs text-green-400">
          Total aprox: {formatCurrency(
            selectedProduct.price * (Number(weightGrams) / 1000)
          )}
        </p>
      )}
    </>
  ) : (
    <>
      <label className="text-sm text-gray-400">
        Cantidad
      </label>

      <input
        type="number"
        min={1}
        value={saleQuantity}
onChange={(e) => setSaleQuantity(e.target.value)}
placeholder="Ej: 1"
        className="w-full bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3 text-white"
      />
    </>
  )}

</div>

          {/* Tipo venta */}
          

{/* Método de pago */}
{salePaid && (
  <div className="space-y-2">
    <label className="text-sm text-gray-400">Método de pago</label>

    <div className="grid grid-cols-1 gap-2">
      <label className="flex items-center gap-2 bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3">
        <input
          type="radio"
          checked={paymentType === "cash"}
          onChange={() => setPaymentType("cash")}
        />
        💵 Efectivo
      </label>

      <label className="flex items-center gap-2 bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3">
        <input
          type="radio"
          checked={paymentType === "transfer"}
          onChange={() => setPaymentType("transfer")}
        />
        🏦 Transferencia
      </label>

      <label className="flex items-center gap-2 bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3">
        <input
          type="radio"
          checked={paymentType === "card"}
          onChange={() => setPaymentType("card")}
        />
        💳 Tarjeta
      </label>
    </div>
  </div>
)}

          {/* Cliente */}
         

          {/* BOTÓN */}
          
  <div className="flex flex-col gap-3">

  <button
    type="button"
    onClick={addToCart}
    disabled={!selectedProduct}
    className="w-full bg-yellow-600 hover:bg-yellow-700 rounded-xl p-4 font-semibold transition"
  >
    ➕ Agregar al carrito
  </button>

  <button
    type="button"
    onClick={createCartSale}
    disabled={cart.length === 0 || creating}
    className="w-full bg-green-600 hover:bg-green-700 rounded-xl p-4 font-semibold transition"
  >
    🧾 Finalizar venta ({formatCurrency(cartTotal)})
  </button>

</div>

</div>

{/* PANEL DERECHO */}
<div className="bg-[#14141A] border border-[#2A2A32] rounded-2xl p-6 space-y-5 shadow-md">
  <h2 className="text-lg font-medium">Carrito</h2>

{cart.length === 0 ? (
  <p className="text-gray-400 text-sm">Carrito vacío</p>
) : (
  <div className="space-y-3">
   {cart.map((item, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{
      opacity: 1,
      scale: 1,
      boxShadow:
        item.product_id === lastAddedId
          ? "0 0 15px rgba(34,197,94,0.6)"
          : "0 0 0px rgba(0,0,0,0)"
    }}
    transition={{ duration: 0.3 }}
    className="flex justify-between items-center bg-[#0F0F14] p-3 rounded-xl"
  >
    
   <div className="flex items-center gap-3 min-w-0">

  {/* MINIATURA */}
  <div
    className="
      w-12 h-12
      shrink-0
      rounded-lg
      bg-white
      overflow-hidden
      flex items-center justify-center
    "
  >

    {item.image_url ? (
      <img
        src={item.image_url}
        alt={item.name}
        className="w-full h-full object-contain p-1"
      />
    ) : (
      <div className="w-full h-full bg-[#17171F] flex items-center justify-center text-gray-500">
        📦
      </div>
    )}

  </div>


  {/* INFORMACIÓN */}
  <div className="min-w-0">

    <p className="text-sm font-medium text-white truncate">
      {item.name}
    </p>

    <p className="text-xs text-gray-400">

      {item.sale_type === 'weight' ? (
        <>
          {item.quantity_label ||
            `${Math.round(item.quantity * 1000)}g`}
          {' · '}
          {formatCurrency(
            item.price_by === '100g'
              ? item.price / 10
              : item.price
          )}
          /{item.price_by === '100g'
            ? '100g'
            : 'kg'}
        </>
      ) : (
        <>
          {item.quantity} {item.unit}
          {' · '}
          {formatCurrency(item.price)}
        </>
      )}

    </p>

  </div>

</div>
    <button
      onClick={() =>
        setCart(prev => prev.filter((_, idx) => idx !== i))
      }
      className="text-red-400 text-xs"
    >
      ✖
    </button>

  </motion.div>
))}

    <div className="text-right text-lg font-semibold text-green-400">
      Total: {formatCurrency(cartTotal)}
    </div>
  </div>
)}

        </div>

      </div>
  {/* HISTORIAL DE VENTAS - ARCANA BASE */}
<div
  ref={salesRef}
  className="
    bg-[#14141A]
    border border-[#2A2A32]
    rounded-2xl
    p-6
    shadow-lg
  "
>

  {/* HEADER */}
  <div className="mb-5">

    <h2 className="text-lg font-semibold text-white">
      Historial de ventas
    </h2>

    <p className="text-xs text-gray-500 mt-1">
      Consultá las ventas registradas de tu negocio.
    </p>

  </div>


  {sales.length === 0 ? (

    <div
      className="
        bg-[#0E0E11]
        border border-[#1F1F24]
        rounded-xl
        p-6
        text-center
      "
    >

      <div className="text-3xl mb-2">
        🧾
      </div>

      <p className="text-sm text-white font-medium">
        Todavía no hay ventas registradas
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Las ventas que registres aparecerán acá.
      </p>

    </div>

  ) : (

    /*
      Altura limitada:
      aproximadamente 5 ventas visibles.
      El resto queda disponible mediante scroll.
    */
    <div
      className="
        max-h-[420px]
        overflow-y-auto
        pr-2
        space-y-5
      "
    >

      {Object.entries(groupedSales).map(
        ([dayKey, daySales]) => {

          const firstSale = daySales[0]

          return (

            <div key={dayKey}>

              {/* SEPARADOR DEL DÍA */}
              <div
                className="
                  sticky
                  top-0
                  z-10
                  bg-[#14141A]
                  py-2
                  mb-2
                  border-b border-[#24242C]
                "
              >

                <p
                  className="
                    text-[11px]
                    uppercase
                    tracking-[0.12em]
                    font-semibold
                    text-gray-500
                  "
                >
                  {getSaleDayLabel(firstSale.created_at)}
                </p>

              </div>


              <div className="space-y-2">

                <AnimatePresence>

                  {daySales.map((sale: any) => {

                    const totalUnits =
                      sale.sale_items?.reduce(
                        (acc: number, item: any) =>
                          item.products?.sale_type !== 'weight'
                            ? acc + Number(item.quantity || 0)
                            : acc,
                        0
                      ) || 0

                    const totalWeightKg =
                      sale.sale_items?.reduce(
                        (acc: number, item: any) =>
                          item.products?.sale_type === 'weight'
                            ? acc + Number(item.quantity || 0)
                            : acc,
                        0
                      ) || 0

                    const productsCount =
                      sale.sale_items?.length || 0

                    const paymentLabel =
                      sale.payment_method === 'paid'
                        ? sale.payment_type === 'cash'
                          ? '💵 Efectivo'
                          : sale.payment_type === 'transfer'
                          ? '🏦 Transferencia'
                          : sale.payment_type === 'card'
                          ? '💳 Tarjeta'
                          : 'Pago'
                        : '🟡 Fiado'

                    return (

                      <motion.div
                        key={sale.id}
                        initial={{
                          opacity: 0,
                          y: 10
                        }}
                        animate={{
                          opacity: 1,
                          y: 0
                        }}
                        transition={{
                          duration: 0.25
                        }}
                        className="
                          bg-[#0E0E11]
                          border border-[#1F1F24]
                          rounded-xl
                          px-4 py-3
                          hover:border-[#30303A]
                          transition
                        "
                      >

                        <div
                          className="
                            flex
                            flex-col
                            md:flex-row
                            md:items-center
                            justify-between
                            gap-3
                          "
                        >

                          {/* DATOS PRINCIPALES */}
                          <div className="min-w-0 flex-1">

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                                flex-wrap
                              "
                            >

                              <span className="text-sm">
                                🧾
                              </span>

                              <p className="text-sm text-white font-semibold">
                                Venta #{sale.id.slice(0, 6)}
                              </p>

                              <span className="text-gray-700">
                                •
                              </span>

                              <p className="text-xs text-gray-400">
                                {new Date(
                                  sale.created_at
                                ).toLocaleTimeString(
                                  'es-AR',
                                  {
                                    timeZone:
                                      'America/Argentina/Buenos_Aires',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }
                                )}
                              </p>

                            </div>


                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-x-4
                                gap-y-1
                                mt-2
                              "
                            >

                              <p className="text-xs text-gray-400">
                                {sale.customers?.name ||
                                  'Venta directa'}
                              </p>

                              <span
                                className={`
                                  text-xs
                                  px-2 py-0.5
                                  rounded-full
                                  ${
                                    sale.payment_method === 'paid'
                                      ? 'bg-green-500/10 text-green-400'
                                      : 'bg-yellow-500/10 text-yellow-400'
                                  }
                                `}
                              >
                                {paymentLabel}
                              </span>

                              <p className="text-xs text-gray-500">

                                {productsCount}{' '}

                                {productsCount === 1
                                  ? 'producto'
                                  : 'productos'}

                              </p>

                              {totalUnits > 0 && (

                                <p className="text-xs text-gray-500">
                                  {totalUnits} un
                                </p>

                              )}

                              {totalWeightKg > 0 && (

                                <p className="text-xs text-cyan-400">
                                  {Math.round(
                                    totalWeightKg * 1000
                                  )}
                                  g
                                </p>

                              )}

                            </div>

                          </div>


                          {/* TOTAL + BOTÓN */}
                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              md:justify-end
                              gap-5
                              shrink-0
                            "
                          >

                            <div className="text-left md:text-right">

                              <p
                                className="
                                  text-[10px]
                                  uppercase
                                  tracking-wide
                                  text-gray-600
                                "
                              >
                                Total
                              </p>

                              <p className="text-base font-bold text-green-400">
                                {formatCurrency(
                                  sale.total_amount
                                )}
                              </p>

                            </div>


                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRecentSale(
                                  sale
                                )
                              }
                              className="
                                text-xs
                                text-[#6EA8FF]
                                hover:text-white
                                bg-[#1F6BFF]/10
                                hover:bg-[#1F6BFF]/20
                                border border-[#1F6BFF]/20
                                rounded-lg
                                px-3 py-2
                                transition
                                whitespace-nowrap
                              "
                            >
                              Ver detalle →
                            </button>

                          </div>

                        </div>

                      </motion.div>

                    )

                  })}

                </AnimatePresence>

              </div>

            </div>

          )

        }
      )}

    </div>

  )}


  {/* ARCANA IMPULSO */}
  <div
    className="
      mt-5
      pt-4
      border-t border-[#1F1F24]
      flex
      flex-col
      sm:flex-row
      sm:items-center
      justify-between
      gap-3
    "
  >

    <div>

      <p className="text-xs text-gray-400">
        ¿Querés encontrar una venta más rápido?
      </p>

      <p className="text-[11px] text-gray-600 mt-0.5">
        Búsqueda, filtros y herramientas avanzadas de historial están disponibles con Arcana Impulso.
      </p>

    </div>


    <span
      className="
        self-start
        sm:self-auto
        text-[10px]
        font-semibold
        px-2.5 py-1
        rounded-full
        bg-[#6C5CE7]/10
        border border-[#6C5CE7]/30
        text-purple-300
      "
    >
      IMPULSO
    </span>

  </div>

</div>

{/* DETALLE DE VENTA RECIENTE */}
{selectedRecentSale && (

  <div
    className="
      fixed inset-0
      z-[1000]
      bg-black/70
      backdrop-blur-sm
      flex
      items-center
      justify-center
      p-4
    "
  >

    <div
      className="
        w-full
        max-w-lg
        bg-[#14141A]
        border border-[#2A2A32]
        rounded-2xl
        shadow-2xl
        overflow-hidden
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
          p-5
          border-b border-[#25252D]
        "
      >

        <div>

          <p className="text-xs text-gray-500">
            Detalle de venta
          </p>

          <h3 className="text-lg font-semibold text-white mt-1">
            Venta #{selectedRecentSale.id.slice(0, 6)}
          </h3>

          <p className="text-xs text-gray-400 mt-1">
            {getSaleDateLabel(selectedRecentSale.created_at)}
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedRecentSale(null)
          }
          className="
            w-9 h-9
            rounded-xl
            bg-[#1A1A22]
            hover:bg-[#23232D]
            text-gray-400
            hover:text-white
            transition
          "
        >
          ✕
        </button>

      </div>


      {/* DATOS GENERALES */}
      <div className="p-5">

        <div
          className="
            grid
            grid-cols-2
            gap-3
            mb-5
          "
        >

          <div
            className="
              bg-[#0E0E11]
              border border-[#1F1F24]
              rounded-xl
              p-3
            "
          >
            <p className="text-[10px] uppercase text-gray-600">
              Cliente
            </p>

            <p className="text-sm text-white mt-1">
              {selectedRecentSale.customers?.name ||
                'Venta directa'}
            </p>
          </div>


          <div
            className="
              bg-[#0E0E11]
              border border-[#1F1F24]
              rounded-xl
              p-3
            "
          >

            <p className="text-[10px] uppercase text-gray-600">
              Pago
            </p>

            <p className="text-sm text-white mt-1">

              {selectedRecentSale.payment_method === 'paid'
                ? selectedRecentSale.payment_type === 'cash'
                  ? '💵 Efectivo'
                  : selectedRecentSale.payment_type === 'transfer'
                  ? '🏦 Transferencia'
                  : selectedRecentSale.payment_type === 'card'
                  ? '💳 Tarjeta'
                  : 'Pago'
                : '🟡 Fiado'}

            </p>

          </div>

        </div>


        {/* PRODUCTOS */}
        <div>

          <p className="text-sm text-gray-400 mb-3">
            Productos vendidos
          </p>

          <div
            className="
              max-h-[300px]
              overflow-y-auto
              space-y-2
              pr-1
            "
          >

            {selectedRecentSale.sale_items?.map(
              (item: any, index: number) => (

                <div
                  key={index}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    bg-[#0E0E11]
                    border border-[#1F1F24]
                    rounded-xl
                    p-3
                  "
                >

                  <div className="min-w-0">

                    <p className="text-sm text-white font-medium truncate">
                      {item.products?.name ||
                        'Producto'}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">

                      {item.products?.sale_type ===
                      'weight'
                        ? `${Math.round(
                            Number(
                              item.quantity || 0
                            ) * 1000
                          )}g`
                        : `${item.quantity} ${
                            item.products?.unit ||
                            'unidad'
                          }`}

                      {' × '}

                      {formatCurrency(
                        Number(item.price_unit || 0)
                      )}

                    </p>

                  </div>


                  <p className="text-sm font-semibold text-gray-200 shrink-0">

                    {formatCurrency(
                      Number(item.quantity || 0) *
                        Number(item.price_unit || 0)
                    )}

                  </p>

                </div>

              )
            )}

          </div>

        </div>


        {/* TOTAL */}
        <div
          className="
            flex
            items-center
            justify-between
            mt-5
            pt-4
            border-t border-[#25252D]
          "
        >

          <span className="text-sm text-gray-400">
            Total de la venta
          </span>

          <span className="text-xl font-bold text-green-400">
            {formatCurrency(
              selectedRecentSale.total_amount
            )}
          </span>

        </div>

      </div>


      {/* FOOTER */}
      <div
        className="
          p-4
          border-t border-[#25252D]
          bg-[#111116]
          flex
          justify-end
        "
      >

        <button
          type="button"
          onClick={() =>
            setSelectedRecentSale(null)
          }
          className="
            px-5 py-2.5
            rounded-xl
            bg-[#1A1A22]
            border border-[#2A2A32]
            text-white
            hover:bg-[#22222B]
            transition
          "
        >
          Cerrar
        </button>

      </div>

    </div>

  </div>

)}

{showTicket && lastSaleTicket && (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
    <div className="ticket-print bg-white text-black rounded-xl w-full max-w-sm p-5 font-mono shadow-2xl">
      
      <div className="text-center mb-4">
          {business?.logo_url && (
    <img
      src={business.logo_url}
      alt="Logo"
      className="w-[90px] h-auto mx-auto mb-1 object-contain"
    />
  )}
        <h2 className="text-lg font-bold uppercase">
          {lastSaleTicket.businessName}
        </h2>
        <p className="text-xs">Ticket interno - No fiscal</p>
        <p className="text-xs">A CONSUMIDOR FINAL</p>
      </div>

      <div className="text-xs mb-3 space-y-1">
        <p>Fecha: {lastSaleTicket.date.toLocaleDateString("es-AR")}</p>
        <p>Hora: {lastSaleTicket.date.toLocaleTimeString("es-AR")}</p>
        <p>Venta: #{lastSaleTicket.saleId?.slice(0, 6)}</p>
        <p>Cliente: {lastSaleTicket.customer}</p>
      </div>

      <hr className="border-black my-3" />

      <div className="space-y-2 text-xs">
        {lastSaleTicket.items.map((item: any, index: number) => (
          <div key={index}>
            <p className="font-bold">{item.name}</p>
            <div className="flex justify-between">
              <span>
  {item.sale_type === 'weight' ? (
    <>
      {item.quantity_label || `${Math.round(item.quantity * 1000)}g`} x{' '}
      {formatCurrency(
        item.price_by === '100g'
          ? item.price / 10
          : item.price
      )}
      /{item.price_by === '100g' ? '100g' : 'kg'}
    </>
  ) : (
    <>
     {item.sale_type === 'weight'
  ? `${item.quantity_label || `${Math.round(item.quantity * 1000)}g`} x ${formatCurrency(
      item.price_by === '100g' ? item.price / 10 : item.price
    )}/${item.price_by === '100g' ? '100g' : 'kg'}`
  : `${item.quantity} x ${formatCurrency(item.price)}`}
    </>
  )}
</span>
              <span>
                {formatCurrency(item.quantity * item.price)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <hr className="border-black my-3" />

      <div className="text-sm space-y-1">
       {lastSaleTicket.units > 0 && (
  <div className="flex justify-between">
    <span>Unidades</span>
    <span>{lastSaleTicket.units}</span>
  </div>
)}

{lastSaleTicket.weightLabel && (
  <div className="flex justify-between">
    <span>Peso vendido</span>
    <span>{lastSaleTicket.weightLabel}</span>
  </div>
)}

        <div className="flex justify-between font-bold text-base">
          <span>TOTAL</span>
          <span>{formatCurrency(lastSaleTicket.total)}</span>
        </div>

        <div className="flex justify-between">
          <span>Método</span>
          <span>
  {lastSaleTicket.paymentMethod === "Pago"
  ? (lastSaleTicket.paymentType === "cash"
      ? "💵 Efectivo"
      : lastSaleTicket.paymentType === "transfer"
      ? "🏦 Transferencia"
      : lastSaleTicket.paymentType === "card"
      ? "💳 Tarjeta"
      : "Pago")
  : "Fiado"}
</span>
        </div>
      </div>

      <p className="text-center text-xs mt-4">
        Gracias por tu compra
      </p>
      <p className="text-center text-[10px] mt-1">
        Comprobante no válido como factura
      </p>
      <p className="text-center text-[10px]">
        Generado por Arcana POS
      </p>

      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={printTicket}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-sans"
        >
          Imprimir
        </button>

        <button
          type="button"
          onClick={() => setShowTicket(false)}
          className="w-full bg-gray-300 text-black py-2 rounded-lg font-sans"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

</div>
)
}
