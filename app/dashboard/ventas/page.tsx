'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion"
import { useRef } from 'react'


type Product = {
  id: string
  name: string
  stock_quantity: number
  price: number
  unit: string
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

  const [saleQuantity, setSaleQuantity] = useState(1)
  const [creating, setCreating] = useState(false)
  const [salePaid, setSalePaid] = useState(true)
  const [sales, setSales] = useState<any[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [scannerActive, setScannerActive] = useState(false)
  const scannerRef = useRef<HTMLInputElement | null>(null)
  const lastScanRef = useRef<number>(0)
  const beep = () => {
  const audio = new Audio("/beep.mp3")
  audio.play()
}
  const [toast, setToast] = useState<{
  type: "success" | "error"
  message: string
} | null>(null)


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

  setScannerActive(true)
setTimeout(() => setScannerActive(false), 500)

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

  setSelectedProduct(product)
  setSaleQuantity(1)

  beep()

 await createSale(product)

  ;(e.target as HTMLInputElement).value = ""
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
      <div>
        <h1 className="text-3xl font-semibold">🧾 Nueva Venta</h1>
        <p className="text-gray-400 text-sm">
          Registrá ventas rápidas y seguras.
        </p>
      </div>

<div className="flex items-center gap-3 text-sm text-gray-400 mb-4">

  <span className="text-gray-400">
    Scanner
  </span>

  <div
    className={`w-4 h-4 rounded-full ${
      scannerActive ? "bg-green-500" : "bg-gray-600"
    }`}
  />

  <span className="text-xs">
    {scannerActive ? "Activo" : "Inactivo"}
  </span>

</div>

{scannerActive && (
  <div className="text-xs text-green-400 mb-4">
    Escaneá un producto...
  </div>
)}

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

        {/* PANEL IZQUIERDO */}
       
        <div className="bg-[#14141A] border border-[#2A2A32] rounded-2xl p-6 space-y-5 
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
          
  <button
  type="button"
  onClick={() => createSale()}
 disabled={
  creating ||
  !selectedProduct ||
  selectedProduct.stock_quantity < saleQuantity
}
 className={`w-full rounded-xl p-4 font-semibold flex items-center justify-center gap-3 transition-all duration-300
${creating || !selectedProduct || selectedProduct.stock_quantity < saleQuantity
  ? 'bg-gray-600 cursor-not-allowed'
  : successFlash
    ? 'bg-green-600 shadow-lg shadow-green-500/30'
    : 'bg-[#1F6BFF] hover:bg-[#2E7BFF] active:scale-95'
}`}
>
  {creating && (
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
  )}

  {creating ? "Procesando venta..." : "Registrar venta"}
</button>

 
        </div>

        {/* PANEL DERECHO */}
        <div className="bg-[#14141A] border border-[#2A2A32] rounded-2xl p-6 space-y-5 shadow-md">

          <h2 className="text-lg font-medium">Resumen</h2>

          {selectedProduct && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              <p><strong>Producto:</strong> {selectedProduct.name}</p>
              <p><strong>Stock actual:</strong> {selectedProduct.stock_quantity}</p>
              <p><strong>Cantidad:</strong> {saleQuantity}</p>

              {selectedProduct.stock_quantity >= saleQuantity ? (
                <div className="bg-[#132A1A] text-green-400 rounded-xl p-3">
                  ✔ Stock suficiente
                </div>
              ) : (
                <div className="bg-[#2A1414] text-red-400 rounded-xl p-3">
                  ✖ Stock insuficiente
                </div>
              )}
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
        const item = sale.sale_items?.[0]

        return (
          <motion.div
            key={sale.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex justify-between items-center bg-[#0E0E11] border border-[#1F1F24] rounded-xl p-3"
          >
            <div>
              <p className="text-white font-medium">
                {item?.products?.name || "Producto"}
              </p>
              <p className="text-xs text-gray-400">
                {sale.customers?.name || "Venta directa"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-300">
                {item?.quantity} {item?.products?.unit} · ${sale.total_amount}
              </p>

              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  sale.payment_method === "paid"
                    ? "bg-green-900 text-green-400"
                    : "bg-yellow-900 text-yellow-400"
                }`}
              >
                {sale.payment_method === "paid" ? "Pago" : "Fiado"}
              </span>
            </div>
          </motion.div>
        )
      })}
    </AnimatePresence>
        </div>
  )}
</div>
</div>
)
}
