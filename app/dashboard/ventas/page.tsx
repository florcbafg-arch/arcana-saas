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
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const scanProcessingRef = useRef(false)
const lastScannedCodeRef = useRef<string>('')
  const [showUsbScanner, setShowUsbScanner] = useState(false)
const usbScannerInputRef = useRef<HTMLInputElement | null>(null)
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

const processScannerCode = async (
  rawCode: string,
  input?: HTMLInputElement
) => {
  const code = rawCode.trim()

  if (!code || !selectedBusinessId) return

  // Evita procesar dos eventos simultáneos
  if (scanProcessingRef.current) return

  const now = Date.now()

  // Protección contra una doble señal accidental
  if (
    lastScannedCodeRef.current === code &&
    now - lastScanRef.current < 250
  ) {
    if (input) {
      input.value = ''
      input.focus()
    }

    return
  }

  scanProcessingRef.current = true
  lastScannedCodeRef.current = code
  lastScanRef.current = now

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .or(`barcode.eq.${code},code.eq.${code}`)
      .eq('business_id', selectedBusinessId)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error(
        'ERROR BUSCANDO PRODUCTO EN VENTAS:',
        error
      )

      setToast({
        type: 'error',
        message:
          'No pudimos leer el producto. Podés seguir escaneando.'
      })

      return
    }

    if (!product) {
      setToast({
        type: 'warning',
        message:
          'Este producto no está en tu catálogo. Podés seguir escaneando.'
      })

      return
    }

    if (Number(product.stock_quantity) <= 0) {
      setToast({
        type: 'warning',
        message:
          `${product.name} no tiene stock disponible.`
      })

      return
    }

    beep()

    addProductToCart(product, 1)

    setToast({
      type: 'success',
      message:
        `${product.name} agregado al carrito`
    })

  } finally {
    if (input) {
      input.value = ''

      setTimeout(() => {
        input.focus()
      }, 30)
    }

    scanProcessingRef.current = false
  }
}


const handleScannerInput = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const input = e.target

  if (scanTimerRef.current) {
    clearTimeout(scanTimerRef.current)
  }

  /*
   * La pistola escribe el EAN muy rápido.
   * Esperamos un instante desde el último carácter.
   * Si no llega otro carácter, asumimos que terminó la lectura.
   */
  scanTimerRef.current = setTimeout(() => {
    processScannerCode(
      input.value,
      input
    )
  }, 90)
}


const handleScanner = async (
  e: React.KeyboardEvent<HTMLInputElement>
) => {
  /*
   * Enter queda como respaldo.
   * Algunos lectores USB lo envían automáticamente.
   */
  if (e.key !== 'Enter') return

  e.preventDefault()

  if (scanTimerRef.current) {
    clearTimeout(scanTimerRef.current)
  }

  const input = e.currentTarget

  await processScannerCode(
    input.value,
    input
  )
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
<div
  className="
    grid
    grid-cols-3
    gap-2
    md:gap-4
  "
>

  {/* CAJA DE HOY */}
  <div
    className="
      bg-[#14141A]
      border border-[#2A2A32]
      rounded-xl
      px-3 py-3
      md:p-4
    "
  >
    <p className="text-[10px] md:text-xs text-gray-400">
      Caja de hoy
    </p>

    <motion.p
      key={salesSummary.total}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="
        text-sm
        md:text-lg
        font-semibold
        text-green-400
        mt-1
      "
    >
      {formatCurrency(salesSummary.total)}
    </motion.p>
  </div>


  {/* VENTAS */}
  <div
    className="
      bg-[#14141A]
      border border-[#2A2A32]
      rounded-xl
      px-3 py-3
      md:p-4
    "
  >
    <p className="text-[10px] md:text-xs text-gray-400">
      Ventas
    </p>

    <motion.p
      key={salesSummary.count}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="
        text-sm
        md:text-lg
        font-semibold
        mt-1
      "
    >
      {salesSummary.count}
    </motion.p>
  </div>


  {/* UNIDADES */}
  <div
    className="
      bg-[#14141A]
      border border-[#2A2A32]
      rounded-xl
      px-3 py-3
      md:p-4
    "
  >
    <p className="text-[10px] md:text-xs text-gray-400">
      Unidades
    </p>

    <motion.div
      key={`${salesSummary.units}-${salesSummary.weightKg}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-1"
    >
      <p className="text-sm md:text-lg font-semibold">
        {salesSummary.units} un
      </p>

      {salesSummary.weightKg > 0 && (
        <p className="text-[9px] md:text-xs text-cyan-400 mt-0.5">
          {salesSummary.weightKg.toFixed(2)} kg
        </p>
      )}
    </motion.div>
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

    {/* ================================================= */}
{/* VENTA PRINCIPAL — ARCANA BASE */}
{/* ================================================= */}

<div
  className="
    grid
    grid-cols-1
    md:grid-cols-[minmax(0,1fr)_320px]
    gap-5
    w-full
  "
>

  {/* ================================================= */}
  {/* COLUMNA PRINCIPAL — BUSCAR + CARRITO */}
  {/* ================================================= */}

  <div
    className="
      bg-[#14141A]
      border border-[#2A2A32]
      rounded-2xl
      overflow-hidden
    "
  >
{/* ================================================= */}
{/* HEADER MOBILE */}
{/* ================================================= */}

<div className="md:hidden">

  {/* BOTÓN FINO DE CÁMARA */}
  <div className="p-4 pb-3">

    <button
      type="button"
      onClick={() => setShowScanner(true)}
      className="
        w-full
        flex
        items-center
        justify-center
        gap-2
        rounded-xl
        border
        border-[#6C5CE7]/40
        bg-[#6C5CE7]/10
        px-4
        py-3
        text-sm
        font-semibold
        text-purple-300
        active:scale-[0.99]
        transition
      "
    >
      📷 Escanear producto
    </button>

  </div>


  {/* HEADER CARRITO MOBILE */}
  <div
    className="
      flex
      items-center
      justify-between
      gap-3
      px-4
      pb-3
    "
  >

    <div className="flex items-center gap-2">

      <h2 className="text-base font-semibold text-white">
        Carrito de venta
      </h2>

      <span
        className="
          min-w-[24px]
          h-6
          px-2
          rounded-full
          bg-[#6C5CE7]/15
          border
          border-[#6C5CE7]/30
          text-purple-300
          text-xs
          font-semibold
          flex
          items-center
          justify-center
        "
      >
        {cart.length}
      </span>

    </div>


    {cart.length > 0 && (
      <button
        type="button"
        onClick={() => setCart([])}
        className="
          text-xs
          text-red-400
          px-2
          py-1
        "
      >
        Vaciar
      </button>
    )}

  </div>

</div>


{/* ================================================= */}
{/* HEADER WEB */}
{/* ================================================= */}

<div
  className="
    hidden
    md:flex
    items-center
    justify-between
    gap-4
    px-5
    py-4
    border-b
    border-[#25252D]
  "
>

  <div>

    <h2 className="text-lg font-semibold text-white">
      Carrito de venta
    </h2>

    <p className="text-xs text-gray-500 mt-1">
      Buscá productos o utilizá el lector para agregarlos.
    </p>

  </div>


  <div className="flex items-center gap-2">

    {/* LECTOR USB — WEB */}
    <button
      type="button"
      onClick={() => {
        setShowUsbScanner(true)

        setToast({
          type: 'success',
          message:
            'Conectá tu lector USB y comenzá a escanear productos.'
        })

        setTimeout(() => {
          usbScannerInputRef.current?.focus()
        }, 150)
      }}
      className="
        flex
        items-center
        gap-2
        px-4
        py-2
        rounded-xl
        border
        border-[#6C5CE7]/40
        bg-[#6C5CE7]/10
        text-purple-300
        hover:bg-[#6C5CE7]/20
        transition
        text-sm
        font-medium
      "
    >
      ▥ Usar lector USB
    </button>


    {/* VACIAR */}
    {cart.length > 0 && (
      <button
        type="button"
        onClick={() => setCart([])}
        className="
          text-xs
          text-red-400
          hover:text-red-300
          border
          border-red-500/20
          bg-red-500/5
          rounded-lg
          px-3
          py-2
          transition
        "
      >
        🗑 Vaciar carrito
      </button>
    )}

  </div>

</div>


    {/* ================================================= */}
    {/* BÚSQUEDA MANUAL */}
    {/* ================================================= */}

    <div className="p-5 border-b border-[#25252D]">

      <div className="relative">

        <span
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-gray-500
          "
        >
          🔎
        </span>

        <input
          type="text"
          value={productSearch}
          onChange={(e) => {
            setProductSearch(e.target.value)
            setSelectedProduct(null)
          }}
          placeholder="Buscar producto por nombre, código o EAN..."
          className="
            w-full
            bg-[#0B0B10]
            border border-[#2A2A32]
            rounded-xl
            py-3
            pl-11
            pr-4
            text-white
            placeholder:text-gray-600
            focus:outline-none
            focus:ring-2
            focus:ring-[#1F6BFF]/40
          "
        />

      </div>


      {/* RESULTADOS */}
      {productSearch && !selectedProduct && (
        <div
          className="
            mt-2
            bg-[#0B0B10]
            border border-[#2A2A32]
            rounded-xl
            overflow-hidden
            max-h-56
            overflow-y-auto
          "
        >

          {filteredProducts.length === 0 ? (

            <div className="p-4">

              <p className="text-sm text-gray-400">
                No encontramos ese producto en tu catálogo.
              </p>

              <p className="text-xs text-gray-600 mt-1">
                Podés seguir buscando o registrar otro producto.
              </p>

            </div>

          ) : (

            filteredProducts.map((product) => (

              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setSelectedProduct(product)
                  setProductSearch(product.name)

                  if (
                    product.sale_type !== 'weight'
                  ) {
                    setSaleQuantity('1')
                  }
                }}
                className="
                  w-full
                  flex
                  items-center
                  gap-3
                  text-left
                  p-3
                  hover:bg-[#15151C]
                  border-b
                  border-[#1F1F24]
                  last:border-b-0
                  transition
                "
              >

                {/* IMAGEN */}
                <div
                  className="
                    w-11 h-11
                    shrink-0
                    rounded-lg
                    overflow-hidden
                    bg-[#17171F]
                    flex items-center
                    justify-center
                  "
                >

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="
                        w-full
                        h-full
                        object-contain
                        bg-white
                        p-1
                      "
                    />
                  ) : (
                    <span>
                      📦
                    </span>
                  )}

                </div>


                <div className="min-w-0 flex-1">

                  <p
                    className="
                      text-sm
                      text-white
                      font-medium
                      truncate
                    "
                  >
                    {product.name}
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">

                    Stock: {product.stock_quantity}{' '}

                    {product.sale_type === 'weight'
                      ? 'kg'
                      : product.unit}

                    {' · '}

                    {formatCurrency(product.price)}

                  </p>

                </div>


                <span className="text-[#6EA8FF] text-sm">
                  Seleccionar
                </span>

              </button>

            ))

          )}

        </div>
      )}


      {/* ================================================= */}
      {/* PRODUCTO SELECCIONADO */}
      {/* ================================================= */}

      {selectedProduct && (

        <motion.div
          initial={{
            opacity: 0,
            y: 6
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          className="
            mt-4
            rounded-2xl
            border border-[#1F6BFF]/30
            bg-[#101522]
            p-4
          "
        >

          <div
            className="
              flex
              items-center
              gap-4
            "
          >

            {/* IMAGEN */}
            <div
              className="
                w-16 h-16
                shrink-0
                rounded-xl
                overflow-hidden
                bg-[#17171F]
                flex items-center
                justify-center
              "
            >

              {selectedProduct.image_url ? (

                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="
                    w-full
                    h-full
                    object-contain
                    bg-white
                    p-1
                  "
                />

              ) : (

                <span className="text-2xl">
                  📦
                </span>

              )}

            </div>


            {/* INFO */}
            <div className="min-w-0 flex-1">

              <p
                className="
                  text-white
                  font-semibold
                  truncate
                "
              >
                {selectedProduct.name}
              </p>


              {(selectedProduct.brand ||
                selectedProduct.quantity) && (

                <p className="text-xs text-gray-500 mt-1">

                  {[
                    selectedProduct.brand,
                    selectedProduct.quantity
                  ]
                    .filter(Boolean)
                    .join(' · ')}

                </p>

              )}


              <div
                className="
                  flex
                  items-center
                  gap-3
                  mt-2
                "
              >

                <span
                  className="
                    text-green-400
                    font-semibold
                  "
                >
                  {formatCurrency(
                    selectedProduct.price
                  )}
                </span>

                <span className="text-xs text-gray-500">
                  Stock: {selectedProduct.stock_quantity}{' '}
                  {selectedProduct.sale_type === 'weight'
                    ? 'kg'
                    : selectedProduct.unit}
                </span>

              </div>

            </div>

          </div>


          {/* ============================================= */}
          {/* CANTIDAD */}
          {/* ============================================= */}

          <div
            className="
              grid
              grid-cols-[1fr_auto]
              gap-3
              mt-4
              pt-4
              border-t
              border-[#25252D]
            "
          >

            {selectedProduct.sale_type === 'weight' ? (

              <div>

                <label className="text-xs text-gray-500">
                  Cantidad en gramos
                </label>

                <input
                  type="number"
                  min={1}
                  value={weightGrams}
                  onChange={(e) =>
                    setWeightGrams(
                      e.target.value
                    )
                  }
                  placeholder="Ej: 250"
                  className="
                    mt-1
                    w-full
                    bg-[#0B0B10]
                    border
                    border-[#2A2A32]
                    rounded-xl
                    px-4
                    py-2.5
                    text-white
                  "
                />

              </div>

            ) : (

              <div>

                <label className="text-xs text-gray-500">
                  Cantidad
                </label>

                <input
                  type="number"
                  min={1}
                  value={saleQuantity}
                  onChange={(e) =>
                    setSaleQuantity(
                      e.target.value
                    )
                  }
                  placeholder="Ej: 1"
                  className="
                    mt-1
                    w-full
                    bg-[#0B0B10]
                    border
                    border-[#2A2A32]
                    rounded-xl
                    px-4
                    py-2.5
                    text-white
                  "
                />

              </div>

            )}


            <button
              type="button"
              onClick={addToCart}
              className="
                self-end
                h-[42px]
                px-5
                bg-[#1F6BFF]
                hover:bg-[#2E7BFF]
                rounded-xl
                text-white
                font-medium
                transition
              "
            >
              ➕ Agregar
            </button>

          </div>

        </motion.div>

      )}

    </div>


    {/* ================================================= */}
    {/* CARRITO */}
    {/* ================================================= */}

    <div className="p-5">

      {cart.length === 0 ? (

        <div
          className="
            rounded-2xl
            border border-dashed border-[#2A2A32]
            bg-[#101018]
            py-12
            text-center
          "
        >

          <div className="text-4xl mb-3">
            🛒
          </div>

          <p className="text-white font-medium">
            Carrito vacío
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Buscá o escaneá productos para comenzar.
          </p>

        </div>

      ) : (

        <div className="space-y-2">

          {/* ENCABEZADO TABLA */}
          <div
            className="
              hidden
              md:grid
              grid-cols-[minmax(0,1fr)_110px_130px_110px_40px]
              gap-3
              px-3
              pb-2
              text-[11px]
              uppercase
              tracking-wide
              text-gray-600
            "
          >
            <span>Producto</span>
            <span>Precio</span>
            <span className="text-center">
              Cantidad
            </span>
            <span className="text-right">
              Subtotal
            </span>
            <span />
          </div>


          <AnimatePresence>
            

            {cart.map((item, i) => {



              const sourceProduct =
                products.find(
                  (p) =>
                    p.id ===
                    item.product_id
                )

              return (

                
                <motion.div
                  key={item.product_id}
                  initial={{
                    opacity: 0,
                    y: 6
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    boxShadow:
                      item.product_id ===
                      lastAddedId
                        ? '0 0 18px rgba(34,197,94,0.18)'
                        : '0 0 0 rgba(0,0,0,0)'
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.97
                  }}
                  className="
  grid
  grid-cols-1
  md:grid-cols-[minmax(0,1fr)_110px_130px_110px_40px]

  gap-3
  md:items-center

  rounded-2xl
  md:rounded-xl

  border
  border-[#25252D]
  bg-[#0E0E11]

  p-3
  md:px-3
  md:py-3
"
                >

                  {/* PRODUCTO */}
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      min-w-0
                    "
                  >

                    <div
                      className="
                        w-11 h-11
                        shrink-0
                        rounded-lg
                        overflow-hidden
                        bg-[#17171F]
                        flex
                        items-center
                        justify-center
                      "
                    >

                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="
                            w-full
                            h-full
                            object-contain
                            bg-white
                            p-1
                          "
                        />
                      ) : (
                        <span>
                          📦
                        </span>
                      )}

                    </div>


                    <div className="min-w-0">

                      <p
                        className="
                          text-sm
                          text-white
                          font-medium
                          truncate
                        "
                      >
                        {item.name}
                      </p>

                      {(item.brand ||
                        item.product_quantity) && (

                        <p
                          className="
                            text-[11px]
                            text-gray-600
                            truncate
                          "
                        >
                          {[
                            item.brand,
                            item.product_quantity
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>

                      )}

<div className="md:hidden h-px bg-[#25252D]" />

{/* PRECIO MOBILE */}
<p className="md:hidden text-sm text-[#6EA8FF] font-semibold mt-1">
  {item.sale_type === 'weight'
    ? `${formatCurrency(item.price)}/kg`
    : formatCurrency(item.price)}
</p>

                    </div>

                  </div>


                  {/* PRECIO */}
                  <p className="hidden md:block text-sm text-gray-300">

                    {item.sale_type ===
                    'weight'
                      ? `${formatCurrency(
                          item.price
                        )}/kg`
                      : formatCurrency(
                          item.price
                        )}

                  </p>


                  {/* CANTIDAD */}
                  <div
  className="
    flex
    items-center
    justify-between
    md:justify-center
    w-full
    md:w-auto
  "
>

                    {item.sale_type ===
                    'weight' ? (

                      <span
                        className="
                          px-3
                          py-1.5
                          rounded-lg
                          bg-[#17171F]
                          text-sm
                          text-gray-300
                        "
                      >
                        {item.quantity_label ||
                          `${Math.round(
                            item.quantity *
                              1000
                          )}g`}
                      </span>

                    ) : (

                      <div
  className="
    flex
    items-center
    gap-2
    md:justify-center
  "
>

                        <button
                          type="button"
                          onClick={() => {
                            setCart(
                              (current) =>
                                current
                                  .map(
                                    (
                                      cartItem
                                    ) =>
                                      cartItem.product_id ===
                                      item.product_id
                                        ? {
                                            ...cartItem,
                                            quantity:
                                              Math.max(
                                                0,
                                                Number(
                                                  cartItem.quantity
                                                ) -
                                                  1
                                              )
                                          }
                                        : cartItem
                                  )
                                  .filter(
                                    (
                                      cartItem
                                    ) =>
                                      cartItem.quantity >
                                      0
                                  )
                            )
                          }}
                          className="
                            w-8 h-8
                            rounded-lg
                            bg-[#181820]
                            border
                            border-[#2A2A32]
                            text-gray-300
                            hover:text-white
                          "
                        >
                          −
                        </button>


                        <span
                          className="
                            min-w-[30px]
                            text-center
                            text-white
                            font-semibold
                          "
                        >
                          {item.quantity}
                        </span>


                        <button
                          type="button"
                          onClick={() => {

                            if (
                              sourceProduct &&
                              Number(
                                item.quantity
                              ) + 1 >
                                Number(
                                  sourceProduct.stock_quantity
                                )
                            ) {

                              setToast({
                                type:
                                  'error',
                                message:
                                  'Stock insuficiente'
                              })

                              return
                            }


                            setCart(
                              (current) =>
                                current.map(
                                  (
                                    cartItem
                                  ) =>
                                    cartItem.product_id ===
                                    item.product_id
                                      ? {
                                          ...cartItem,
                                          quantity:
                                            Number(
                                              cartItem.quantity
                                            ) + 1
                                        }
                                      : cartItem
                                )
                            )
                          }}
                          className="
                            w-8 h-8
                            rounded-lg
                            bg-[#181820]
                            border
                            border-[#2A2A32]
                            text-gray-300
                            hover:text-white
                          "
                        >
                          +
                        </button>

                      </div>

                    )}

                  </div>

<div className="md:hidden h-px bg-[#25252D]" />

{/* FOOTER MOBILE */}
<div
  className="
    md:hidden
    flex
    items-center
    justify-between
    gap-3
  "
>
  <div>
    <p className="text-[10px] uppercase tracking-wide text-gray-600">
      Subtotal
    </p>

    <p className="text-base font-bold text-white mt-0.5">
      {formatCurrency(
        Number(item.quantity) *
        Number(item.price)
      )}
    </p>
  </div>

  <button
    type="button"
    onClick={() =>
      setCart((current) =>
        current.filter(
          (cartItem) =>
            cartItem.product_id !== item.product_id
        )
      )
    }
    className="
      text-xs
      text-red-400
      border
      border-red-500/20
      bg-red-500/5
      rounded-lg
      px-3
      py-2
    "
  >
    🗑 Eliminar
  </button>
</div>

                  {/* SUBTOTAL */}
                  <p
  className="
  hidden
  md:block
  text-sm
  font-semibold
  text-right
  text-white
"
>
                    {formatCurrency(
                      item.quantity *
                        item.price
                    )}
                  </p>


                  {/* ELIMINAR */}
                  <button
                    type="button"
                    onClick={() =>
                      setCart(
                        (current) =>
                          current.filter(
                            (
                              cartItem
                            ) =>
                              cartItem.product_id !==
                              item.product_id
                          )
                      )
                    }
    className="
  hidden
  md:block
  text-red-400
  hover:text-red-300
  transition
"
                  >
                    🗑
                  </button>

                </motion.div>

              )

            })}

          </AnimatePresence>


          {/* TOTAL CARRITO */}
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              pt-4
              mt-3
              border-t
              border-[#25252D]
            "
          >

            <p className="text-sm text-gray-500">

              {cart
                .filter(
                  (item) =>
                    item.sale_type !==
                    'weight'
                )
                .reduce(
                  (acc, item) =>
                    acc +
                    Number(
                      item.quantity ||
                        0
                    ),
                  0
                )}{' '}
              unidades

            </p>


            <div className="text-right">

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

              <p
                className="
                  text-xl
                  font-bold
                  text-green-400
                "
              >
                {formatCurrency(
                  cartTotal
                )}
              </p>

            </div>

          </div>

        </div>

      )}

    </div>

  </div>


  {/* ================================================= */}
  {/* COLUMNA DERECHA — COBRO */}
  {/* ================================================= */}

  <div
    className="
      bg-[#14141A]
      border border-[#2A2A32]
      rounded-2xl
      p-5
      h-fit
      md:sticky
      md:top-4
    "
  >

    <div
      className="
        pb-4
        border-b
        border-[#25252D]
      "
    >

      <p className="text-sm font-semibold text-white">
        Cobro y finalización
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Revisá el total y elegí cómo paga.
      </p>

    </div>


    {/* CANTIDAD */}
    <div className="py-5 border-b border-[#25252D]">

      <p
        className="
          text-[10px]
          uppercase
          tracking-wide
          text-gray-600
        "
      >
        Cantidad total
      </p>

      <p className="text-lg text-white font-semibold mt-1">

        {cart
          .filter(
            (item) =>
              item.sale_type !==
              'weight'
          )
          .reduce(
            (acc, item) =>
              acc +
              Number(
                item.quantity ||
                  0
              ),
            0
          )}{' '}
        unidades

      </p>

    </div>


    {/* TOTAL */}
    <div className="py-5 border-b border-[#25252D]">

      <p
        className="
          text-[10px]
          uppercase
          tracking-wide
          text-gray-600
        "
      >
        Total a pagar
      </p>

      <p
        className="
          text-3xl
          font-bold
          text-green-400
          mt-1
        "
      >
        {formatCurrency(
          cartTotal
        )}
      </p>

    </div>


    {/* MÉTODO */}
    <div className="py-5 space-y-3">

      <p className="text-sm text-gray-400">
        Método de pago
      </p>


      <button
        type="button"
        onClick={() =>
          setPaymentType(
            'cash'
          )
        }
        className={`
          w-full
          rounded-xl
          border
          px-4
          py-3
          text-left
          transition
          ${
            paymentType ===
            'cash'
              ? 'bg-green-500/10 border-green-500/40 text-green-400'
              : 'bg-[#0E0E11] border-[#2A2A32] text-gray-300'
          }
        `}
      >
        💵 Efectivo
      </button>


      <button
        type="button"
        onClick={() =>
          setPaymentType(
            'transfer'
          )
        }
        className={`
          w-full
          rounded-xl
          border
          px-4
          py-3
          text-left
          transition
          ${
            paymentType ===
            'transfer'
              ? 'bg-[#1F6BFF]/10 border-[#1F6BFF]/40 text-[#6EA8FF]'
              : 'bg-[#0E0E11] border-[#2A2A32] text-gray-300'
          }
        `}
      >
        🏦 Transferencia
      </button>


      <button
        type="button"
        onClick={() =>
          setPaymentType(
            'card'
          )
        }
        className={`
          w-full
          rounded-xl
          border
          px-4
          py-3
          text-left
          transition
          ${
            paymentType ===
            'card'
              ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/40 text-purple-300'
              : 'bg-[#0E0E11] border-[#2A2A32] text-gray-300'
          }
        `}
      >
        💳 Tarjeta
      </button>

    </div>


    {/* FINALIZAR */}
    <button
      type="button"
      onClick={createCartSale}
      disabled={
        cart.length === 0 ||
        creating
      }
      className="
        w-full
        bg-green-600
        hover:bg-green-500
        disabled:opacity-40
        disabled:cursor-not-allowed
        rounded-xl
        py-4
        text-white
        font-semibold
        transition
      "
    >
      {creating
        ? 'Procesando...'
        : `✓ Finalizar venta · ${formatCurrency(
            cartTotal
          )}`}
    </button>


    {cart.length === 0 && (
      <p
        className="
          text-center
          text-xs
          text-gray-600
          mt-3
        "
      >
        Agregá productos para finalizar la venta.
      </p>
    )}

  </div>

</div>  

{showUsbScanner && (
  <div
    className="
      hidden md:flex
      fixed inset-0
      z-[2500]
      bg-black/70
      backdrop-blur-sm
      items-center
      justify-center
      p-6
    "
  >

    <div
      className="
        w-full
        max-w-5xl
        max-h-[90vh]
        bg-[#14141A]
        border border-[#2A2A32]
        rounded-2xl
        shadow-2xl
        overflow-hidden
        flex
        flex-col
      "
    >

      {/* HEADER */}
      <div
        className="
          shrink-0
          flex
          items-center
          justify-between
          gap-4
          px-6 py-5
          border-b
          border-[#25252D]
        "
      >

        <div>

          <div className="flex items-center gap-3">

            <h2 className="text-xl font-semibold text-white">
              ▥ Lector USB — Ventas
            </h2>

            <span
              className="
                flex
                items-center
                gap-2
                text-xs
                text-green-400
              "
            >
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              Lector listo
            </span>

          </div>

          <p className="text-sm text-gray-400 mt-1">
            Escaneá productos para agregarlos directamente al carrito.
          </p>

        </div>


        <button
          type="button"
          onClick={() => setShowUsbScanner(false)}
          className="
            w-10 h-10
            rounded-xl
            bg-[#181820]
            border border-[#2A2A32]
            text-gray-400
            hover:text-white
          "
        >
          ✕
        </button>

      </div>


      {/* INPUT DEL LECTOR */}
      <div className="shrink-0 px-6 py-4 border-b border-[#25252D]">

        <input
          ref={usbScannerInputRef}
          type="text"
          onChange={handleScannerInput}
          onKeyDown={handleScanner}
          autoFocus
          placeholder="Esperando lectura del lector USB..."
          className="
            w-full
            bg-[#0B0B10]
            border border-[#6C5CE7]/40
            rounded-xl
            px-4 py-3
            text-white
            focus:outline-none
            focus:ring-2
            focus:ring-[#6C5CE7]/40
          "
        />

        <p className="text-xs text-gray-500 mt-2">
          Apuntá al código de barras y presioná el gatillo. Arcana agregará una unidad automáticamente.
        </p>

      </div>


      {/* CONTENIDO */}
      <div
        className="
          flex-1
          min-h-0
          overflow-y-auto
          p-6
          grid
          grid-cols-[minmax(0,1fr)_300px]
          gap-5
        "
      >

        {/* ================================= */}
        {/* CARRITO */}
        {/* ================================= */}

        <div
          className="
            rounded-2xl
            border border-[#25252D]
            bg-[#101018]
            overflow-hidden
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              px-5 py-4
              border-b border-[#25252D]
            "
          >

            <div>

              <p className="text-white font-semibold">
                Productos escaneados
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Podés seguir escaneando sin cerrar esta ventana.
              </p>

            </div>


            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCart([])

                  setTimeout(() => {
                    usbScannerInputRef.current?.focus()
                  }, 50)
                }}
                className="
                  text-xs
                  text-red-400
                  border border-red-500/20
                  bg-red-500/5
                  rounded-lg
                  px-3 py-2
                "
              >
                🗑 Vaciar
              </button>
            )}

          </div>


          {cart.length === 0 ? (

            <div className="py-20 text-center">

              <div className="text-4xl mb-3">
                ▥
              </div>

              <p className="text-white font-medium">
                Listo para escanear
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Escaneá el primer producto para comenzar la venta.
              </p>

            </div>

          ) : (

            <div className="p-4 space-y-2">

              {cart.map((item) => (

                <motion.div
                  key={item.product_id}
                  initial={{
                    opacity: 0,
                    y: 6
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  className="
                    flex
                    items-center
                    gap-4
                    rounded-xl
                    border border-[#25252D]
                    bg-[#0E0E11]
                    p-3
                  "
                >

                  {/* IMAGEN */}
                  <div
                    className="
                      w-12 h-12
                      shrink-0
                      rounded-lg
                      overflow-hidden
                      bg-[#17171F]
                      flex
                      items-center
                      justify-center
                    "
                  >

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="
                          w-full h-full
                          object-contain
                          bg-white
                          p-1
                        "
                      />
                    ) : (
                      <span>
                        📦
                      </span>
                    )}

                  </div>


                  {/* INFORMACIÓN */}
                  <div className="flex-1 min-w-0">

                    <p className="text-sm text-white font-medium truncate">
                      {item.name}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">

                      {item.sale_type === 'weight'
                        ? item.quantity_label ||
                          `${Math.round(item.quantity * 1000)}g`
                        : `${item.quantity} ${
                            item.unit || 'unidad'
                          }`}

                      {' · '}

                      {formatCurrency(item.price)}

                    </p>

                  </div>


                  {/* CANTIDAD */}
                  <div className="text-center">

                    <p className="text-xs text-gray-600">
                      Cant.
                    </p>

                    <p className="text-white font-semibold">
                      {item.sale_type === 'weight'
                        ? item.quantity_label ||
                          `${Math.round(item.quantity * 1000)}g`
                        : item.quantity}
                    </p>

                  </div>


                  {/* SUBTOTAL */}
                  <div className="text-right min-w-[95px]">

                    <p className="text-xs text-gray-600">
                      Subtotal
                    </p>

                    <p className="text-white font-semibold">
                      {formatCurrency(
                        Number(item.quantity) *
                          Number(item.price)
                      )}
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={() => {

                      setCart((current) =>
                        current.filter(
                          (cartItem) =>
                            cartItem.product_id !==
                            item.product_id
                        )
                      )

                      setTimeout(() => {
                        usbScannerInputRef.current?.focus()
                      }, 50)
                    }}
                    className="
                      text-red-400
                      hover:text-red-300
                    "
                  >
                    🗑
                  </button>

                </motion.div>

              ))}

            </div>

          )}

        </div>


        {/* ================================= */}
        {/* COBRO */}
        {/* ================================= */}

        <div
          className="
            rounded-2xl
            border border-[#25252D]
            bg-[#101018]
            p-5
            h-fit
          "
        >

          <p className="text-white font-semibold">
            Cobro
          </p>


          <div className="py-5 border-b border-[#25252D]">

            <p
              className="
                text-[10px]
                uppercase
                tracking-wide
                text-gray-600
              "
            >
              Total a pagar
            </p>

            <p
              className="
                text-3xl
                font-bold
                text-green-400
                mt-1
              "
            >
              {formatCurrency(cartTotal)}
            </p>

          </div>


          <div className="py-5 space-y-3">

            <p className="text-sm text-gray-400">
              Método de pago
            </p>


            <button
              type="button"
              onClick={() => {
                setPaymentType('cash')

                setTimeout(() => {
                  usbScannerInputRef.current?.focus()
                }, 50)
              }}
              className={`
                w-full
                rounded-xl
                border
                px-4 py-3
                text-left
                ${
                  paymentType === 'cash'
                    ? 'bg-green-500/10 border-green-500/40 text-green-400'
                    : 'bg-[#0E0E11] border-[#2A2A32] text-gray-300'
                }
              `}
            >
              💵 Efectivo
            </button>


            <button
              type="button"
              onClick={() => {
                setPaymentType('transfer')

                setTimeout(() => {
                  usbScannerInputRef.current?.focus()
                }, 50)
              }}
              className={`
                w-full
                rounded-xl
                border
                px-4 py-3
                text-left
                ${
                  paymentType === 'transfer'
                    ? 'bg-[#1F6BFF]/10 border-[#1F6BFF]/40 text-[#6EA8FF]'
                    : 'bg-[#0E0E11] border-[#2A2A32] text-gray-300'
                }
              `}
            >
              🏦 Transferencia
            </button>


            <button
              type="button"
              onClick={() => {
                setPaymentType('card')

                setTimeout(() => {
                  usbScannerInputRef.current?.focus()
                }, 50)
              }}
              className={`
                w-full
                rounded-xl
                border
                px-4 py-3
                text-left
                ${
                  paymentType === 'card'
                    ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/40 text-purple-300'
                    : 'bg-[#0E0E11] border-[#2A2A32] text-gray-300'
                }
              `}
            >
              💳 Tarjeta
            </button>

          </div>


          <button
            type="button"
            disabled={
              cart.length === 0 ||
              creating
            }
            onClick={async () => {

              await createCartSale()

              /*
               * No cerramos acá el ticket.
               * createCartSale ya abre el ticket existente.
               */

              setShowUsbScanner(false)
            }}
            className="
              w-full
              rounded-xl
              bg-green-600
              hover:bg-green-500
              disabled:opacity-40
              py-4
              text-white
              font-semibold
            "
          >
            {creating
              ? 'Procesando...'
              : `✓ Finalizar venta · ${formatCurrency(
                  cartTotal
                )}`}
          </button>

        </div>

      </div>

    </div>

  </div>
)}

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
