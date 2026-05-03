'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion"
import { useRef } from 'react'
import BarcodeScanner from "../components/BarcodeScanner"


type Product = {
  id: string
  name: string
  stock_quantity: number
  price: number
  unit: string
  code?: string
  barcode?: string
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [successFlash, setSuccessFlash] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const [business, setBusiness] = useState<any | null>(null)
  const [lastSaleTicket, setLastSaleTicket] = useState<any | null>(null)
  const [showTicket, setShowTicket] = useState(false)
  
  const [saleQuantity, setSaleQuantity] = useState(1)
  const [creating, setCreating] = useState(false)
  const [salePaid, setSalePaid] = useState(true)
  const [paymentType, setPaymentType] = useState("cash")
  const [sales, setSales] = useState<any[]>([])
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
  type: "success" | "error"
  message: string
} | null>(null)
const [salesSummary, setSalesSummary] = useState({
  total: 0,
  count: 0,
  units: 0,
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

useEffect(() => {
  const fetchBusiness = async () => {
    const id = localStorage.getItem('activeBusinessId')
    if (!id) return

    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()

      console.log("DATA BUSINESS:", data)

    setBusiness(data)
  }

  fetchBusiness()
}, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', selectedBusinessId)

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
        products ( name, unit )
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
    .select('name')
    .eq('id', selectedBusinessId)
    .single()

  setBusiness(data)
}

const calculateSummary = (salesData: any[]) => {
  let total = 0
  let count = 0
  let units = 0
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
      units += item.quantity
    })
  })

  setSalesSummary({
    total,
    count,
    units,
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

  if (!saleQuantity || saleQuantity <= 0) {
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

  setSaleQuantity(1)
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
          ? { ...p, quantity: newQty }
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
        unit: product.unit
      }
    ]
  })
}

const addToCart = () => {
  if (!selectedProduct) return

  if (saleQuantity <= 0) {
    setToast({ type: "error", message: "Cantidad inválida" })
    return
  }

  if (selectedProduct.stock_quantity < saleQuantity) {
    setToast({ type: "error", message: "Stock insuficiente" })
    return
  }

  addProductToCart(selectedProduct, saleQuantity)

  setSelectedProduct(null)
  setSaleQuantity(1)
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
  units: cart.reduce((acc, item) => acc + item.quantity, 0),
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

const printTicket = () => {
  window.print()
}

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
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

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
   <motion.p
  key={salesSummary.units}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="text-lg font-semibold"
>
  {salesSummary.units}
</motion.p>
  </div>

  <div className="bg-[#14141A] border border-[#2A2A32] rounded-xl p-4">
    <p className="text-xs text-gray-400">Fiado</p>
    <motion.p
  key={salesSummary.debt}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="text-lg font-semibold text-yellow-400"
>
  {formatCurrency(salesSummary.debt)}
</motion.p>
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
  <BarcodeScanner
    onScan={(code) => {
      const product = products.find(
        (p) => p.code === code || p.barcode === code
      )

      if (product) {
        setSelectedProduct(product)
      }

      setShowScanner(false)
    }}
  />
)}

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

        {/* PANEL IZQUIERDO */}
       
        <div className="md:col-span-1 bg-[#14141A] border border-[#2A2A32] rounded-2xl p-6 space-y-5 
transition-all duration-300 hover:border-[#3B3B44] hover:shadow-xl">

          <h2 className="text-lg font-medium">Registrar venta</h2>

          {/* Producto */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Producto</label>
            <select
              className="w-full bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3 text-white"
              value={selectedProduct?.id || ''}
              onChange={(e) =>
                setSelectedProduct(
                  products.find((p) => p.id === e.target.value) || null
                )
              }
            >
              <option value="">Seleccioná producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock: {p.stock_quantity} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Cantidad</label>
            <input
              type="number"
              min={1}
              value={saleQuantity}
              onChange={(e) => setSaleQuantity(Number(e.target.value))}
              className="w-full bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3 text-white"
            />
          </div>

          {/* Tipo venta */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={salePaid}
                onChange={() => setSalePaid(true)}
              />
              Venta paga
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!salePaid}
                onChange={() => setSalePaid(false)}
              />
              Venta fiado
            </label>
          </div>

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
          {!salePaid && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Cliente</label>
              <select
                className="w-full bg-[#0F0F14] border border-[#2A2A32] rounded-xl p-3 text-white"
                value={selectedCustomer?.id || ''}
                onChange={(e) =>
                  setSelectedCustomer(
                    customers.find((c) => c.id === e.target.value) || null
                  )
                }
              >
                <option value="">Seleccioná cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
<div className="md:col-span-2 bg-[#14141A] border border-[#2A2A32] rounded-2xl p-6 space-y-5 shadow-md">
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
    
    <div>
      <p className="text-sm font-medium">{item.name}</p>
      <p className="text-xs text-gray-400">
        {item.quantity} {item.unit} · {formatCurrency(item.price)}
      </p>
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
  
{/* VENTAS RECIENTES */}
<div
  ref={salesRef}
  className="bg-[#14141A] border border-[#2A2A32] rounded-2xl p-6 shadow-lg max-h-[500px] flex flex-col"
>
  <h2 className="text-lg font-semibold text-white mb-4">
    Ventas recientes
  </h2>

 {sales.length === 0 ? (
  <p className="text-gray-500 text-sm">
    No hay ventas registradas todavía.
  </p>
) : (
  <div className="sales-scroll space-y-3 overflow-y-auto pr-2">

    <AnimatePresence>
      {sales.map((sale) => {
  const totalItems = sale.sale_items?.reduce(
    (acc: number, item: any) => acc + item.quantity,
    0
  )

  return (
    <motion.div
      key={sale.id}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-[#0E0E11] border border-[#1F1F24] rounded-xl p-4 space-y-3"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white font-medium">
            Venta #{sale.id.slice(0, 6)}
          </p>
          <p className="text-xs text-gray-400">
            {sale.customers?.name || "Venta directa"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-300">
            {totalItems} unidad/es · {formatCurrency(sale.total_amount)}
          </p>

          <span
            className={`text-xs px-3 py-1 rounded-full ${
              sale.payment_method === "paid"
                ? "bg-green-900 text-green-400"
                : "bg-yellow-900 text-yellow-400"
            }`}
          >
            {sale.payment_method === "paid"
  ? (sale.payment_type === "cash"
      ? "💵 Efectivo"
      : sale.payment_type === "transfer"
      ? "🏦 Transferencia"
      : sale.payment_type === "card"
      ? "💳 Tarjeta"
      : "Pago")
  : "Fiado"}
          </span>
        </div>
      </div>

      <div className="border-t border-[#1F1F24] pt-3 space-y-2">
        {sale.sale_items?.map((item: any, index: number) => (
          <div
            key={index}
            className="flex justify-between text-xs text-gray-400"
          >
            <span>
              {item.products?.name || "Producto"}
            </span>

            <span>
              {item.quantity} {item.products?.unit} · {formatCurrency(item.price_unit)}
            </span>

          </div>
        ))}

      </div>
    </motion.div>
  )
})}
    </AnimatePresence>
        </div>
  )}
</div>

{showTicket && lastSaleTicket && (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
    <div className="ticket-print bg-white text-black rounded-xl w-full max-w-sm p-5 font-mono shadow-2xl">
      
      <div className="text-center mb-4">
          {business?.logo_url && (
    <img
      src={business.logo_url}
      alt="Logo"
      className="h-10 max-w-[120px] mx-auto object-contain"
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
                {item.quantity} x {formatCurrency(item.price)}
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
        <div className="flex justify-between">
          <span>Unidades</span>
          <span>{lastSaleTicket.units}</span>
        </div>

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
