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
  image_url?: string | null
  expiration_date?: string | null
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

type StockAdjustmentMode =
  | 'entry'
  | 'exit'
  | 'correction'

type WeightInputUnit = 'kg' | 'g'

type HistoryFilter =
  | 'all'
  | 'sales'
  | 'entries'
  | 'exits'
  | 'adjustments'

  type AttentionInfo = {
  priority: number
  label: string
  detail: string
  badgeClass: string
}

const HISTORY_PAGE_SIZE = 50

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [amount, setAmount] = useState(0)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)

const [adjustmentMode, setAdjustmentMode] =
  useState<StockAdjustmentMode>('entry')

const [adjustmentReason, setAdjustmentReason] = useState('')

const [adjustmentNote, setAdjustmentNote] = useState('')

const [weightInputUnit, setWeightInputUnit] =
  useState<WeightInputUnit>('kg')

const [isAdjustingStock, setIsAdjustingStock] =
  useState(false)
const [adjustmentError, setAdjustmentError] = useState('')
const [
  hasAdjustmentAmount,
  setHasAdjustmentAmount
] = useState(false)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [movementPage, setMovementPage] =
  useState(0)

const [
  hasMoreMovements,
  setHasMoreMovements
] = useState(false)

const [
  loadingMoreMovements,
  setLoadingMoreMovements
] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyFilter, setHistoryFilter] =
  useState<HistoryFilter>('all')
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

const getStockStatusInfo = (product: Product) => {
  if (product.stock_quantity <= 0) {
    return {
      label: 'Sin stock',
      textClass: 'text-red-400',
      badgeClass: 'text-red-400 bg-red-500/10 border-red-500/20'
    }
  }

  const status = getStockStatus(product)

  if (status === 'red') {
    return {
      label: 'Stock crítico',
      textClass: 'text-orange-400',
      badgeClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    }
  }

  if (status === 'yellow') {
    return {
      label: 'Bajo stock',
      textClass: 'text-yellow-400',
      badgeClass: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    }
  }

  return {
    label: 'Stock normal',
    textClass: 'text-green-400',
    badgeClass: 'text-green-400 bg-green-500/10 border-green-500/20'
  }
}

const getExpirationDays = (product: Product) => {
  if (!product.expiration_date) return null

  const datePart =
    product.expiration_date.split('T')[0]

  const [year, month, day] = datePart
    .split('-')
    .map(Number)

  if (!year || !month || !day) return null

  const expirationDate = new Date(
    year,
    month - 1,
    day
  )

  expirationDate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.ceil(
    (
      expirationDate.getTime() -
      today.getTime()
    ) /
      86400000
  )
}

const getAttentionInfo = (
  product: Product
): AttentionInfo | null => {
  const expirationDays =
    getExpirationDays(product)

  const stockStatus =
    getStockStatus(product)

  const isOutOfStock =
    product.stock_quantity <= 0

  // 1. Producto vencido
  if (
    expirationDays !== null &&
    expirationDays < 0
  ) {
    const daysAgo = Math.abs(expirationDays)

    return {
      priority: 0,
      label: 'Producto vencido',
      detail:
        daysAgo === 1
          ? 'Venció ayer'
          : `Venció hace ${daysAgo} días`,
      badgeClass:
        'text-red-400 bg-red-500/10 border-red-500/20'
    }
  }

  // 2. Sin stock
  if (isOutOfStock) {
    return {
      priority: 1,
      label: 'Sin stock',
      detail: 'No quedan existencias',
      badgeClass:
        'text-red-400 bg-red-500/10 border-red-500/20'
    }
  }

  // 3. Vence hoy o mañana
  if (
    expirationDays === 0 ||
    expirationDays === 1
  ) {
    return {
      priority: 2,
      label:
        expirationDays === 0
          ? 'Vence hoy'
          : 'Vence mañana',
      detail:
        expirationDays === 0
          ? 'Revisalo durante el día'
          : 'Revisalo cuanto antes',
      badgeClass:
        'text-orange-400 bg-orange-500/10 border-orange-500/20'
    }
  }

  // 4. Stock crítico
  if (stockStatus === 'red') {
    return {
      priority: 3,
      label: 'Stock crítico',
      detail: `Quedan ${formatStockQuantity(
        product
      )}`,
      badgeClass:
        'text-orange-400 bg-orange-500/10 border-orange-500/20'
    }
  }

  // 5. Vence dentro de 7 días
  if (
    expirationDays !== null &&
    expirationDays <= 7
  ) {
    return {
      priority: 4,
      label: 'Vence pronto',
      detail: `Faltan ${expirationDays} días`,
      badgeClass:
        'text-orange-400 bg-orange-500/10 border-orange-500/20'
    }
  }

  // 6. Bajo stock
  if (stockStatus === 'yellow') {
    return {
      priority: 5,
      label: 'Bajo stock',
      detail: `Quedan ${formatStockQuantity(
        product
      )}`,
      badgeClass:
        'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    }
  }

  // 7. Vence dentro de 30 días
  if (
    expirationDays !== null &&
    expirationDays <= 30
  ) {
    return {
      priority: 6,
      label: 'Próximo a vencer',
      detail: `Faltan ${expirationDays} días`,
      badgeClass:
        'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    }
  }

  return null
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

const fetchMovements = async (
  productId: string,
  page = 0
) => {
  if (!selectedBusinessId) return

  if (page === 0) {
  setLoadingMovements(true)
  setMovementPage(0)
  setHasMoreMovements(false)
  setMovements([])
} else {
  setLoadingMoreMovements(true)
}

  const from =
    page * HISTORY_PAGE_SIZE

  const to =
    from + HISTORY_PAGE_SIZE - 1

  try {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .eq('business_id', selectedBusinessId)
      .order('created_at', {
        ascending: false
      })
      .range(from, to)

    if (error) {
      console.error(
        'Error cargando movimientos:',
        error
      )
      return
    }

    const newMovements = data || []

    setMovements((currentMovements) => {
      if (page === 0) {
        return newMovements
      }

      const existingIds = new Set(
        currentMovements.map(
          (movement) => movement.id
        )
      )

      const uniqueMovements =
        newMovements.filter(
          (movement) =>
            !existingIds.has(movement.id)
        )

      return [
        ...currentMovements,
        ...uniqueMovements
      ]
    })

    setMovementPage(page)

    setHasMoreMovements(
      newMovements.length ===
        HISTORY_PAGE_SIZE
    )
  } finally {
    setLoadingMovements(false)
    setLoadingMoreMovements(false)
  }
}

  const getNormalizedAdjustmentAmount = () => {
  if (!selectedProduct) return 0

  if (
    selectedProduct.sale_type === 'weight' &&
    weightInputUnit === 'g'
  ) {
    return amount / 1000
  }

  return amount
}

const getAdjustmentChange = () => {
  if (!selectedProduct) return 0

  const normalizedAmount =
    getNormalizedAdjustmentAmount()

  if (adjustmentMode === 'entry') {
    return normalizedAmount
  }

  if (adjustmentMode === 'exit') {
    return -normalizedAmount
  }

  return normalizedAmount -
    selectedProduct.stock_quantity
}

const getResultingStock = () => {
  if (!selectedProduct) return 0

  return (
    selectedProduct.stock_quantity +
    getAdjustmentChange()
  )
}

const adjustmentReasons =
  adjustmentMode === 'entry'
    ? [
        'Compra a proveedor',
        'Devolución recibida',
        'Stock inicial',
        'Otro'
      ]
    : adjustmentMode === 'exit'
    ? [
        'Rotura o merma',
        'Producto vencido',
        'Consumo interno',
        'Otro'
      ]
    : [
        'Conteo físico',
        'Error de carga',
        'Otro'
      ]

const addStock = async () => {
  if (!selectedProduct || !selectedBusinessId) return

  setAdjustmentError('')

  if (!hasAdjustmentAmount) {
  setAdjustmentError(
    'Ingresá una cantidad para continuar.'
  )
  return
}

  const normalizedAmount =
    getNormalizedAdjustmentAmount()

  if (
    adjustmentMode !== 'correction' &&
    normalizedAmount <= 0
  ) {
    setAdjustmentError(
      'Ingresá una cantidad mayor que cero.'
    )
    return
  }

  if (
    adjustmentMode === 'correction' &&
    normalizedAmount < 0
  ) {
    setAdjustmentError(
      'El stock físico no puede ser negativo.'
    )
    return
  }

  if (
    selectedProduct.sale_type !== 'weight' &&
    !Number.isInteger(normalizedAmount)
  ) {
    setAdjustmentError(
      'Los productos por unidad no aceptan decimales.'
    )
    return
  }

  if (!adjustmentReason.trim()) {
    setAdjustmentError(
      'Seleccioná un motivo para continuar.'
    )
    return
  }

  const rawChange = getAdjustmentChange()

  const stockChange = Number(
    rawChange.toFixed(3)
  )

  const resultingStock = Number(
    (
      selectedProduct.stock_quantity +
      stockChange
    ).toFixed(3)
  )

  if (stockChange === 0) {
    setAdjustmentError(
      'El stock ingresado es igual al actual.'
    )
    return
  }

  if (resultingStock < 0) {
    setAdjustmentError(
      'La salida supera el stock disponible.'
    )
    return
  }

  const movementType =
    adjustmentMode === 'entry'
      ? 'Entrada'
      : adjustmentMode === 'exit'
      ? 'Salida'
      : 'Ajuste'

  const fullReason = adjustmentNote.trim()
    ? `${movementType}: ${adjustmentReason.trim()} · ${adjustmentNote.trim()}`
    : `${movementType}: ${adjustmentReason.trim()}`

  setIsAdjustingStock(true)

  try {
    const { error } = await supabase.rpc(
      'adjust_stock_atomic',
      {
        p_business_id: selectedBusinessId,
        p_product_id: selectedProduct.id,
        p_change: stockChange,
        p_reason: fullReason
      }
    )

    if (error) {
      console.error(
        'Error ajustando stock:',
        error
      )

      setAdjustmentError(
        'No pudimos actualizar el stock. Intentá nuevamente.'
      )
      return
    }

    await fetchProducts()

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', selectedProduct.id)
      .eq('business_id', selectedBusinessId)
      .eq('active', true)
      .single()

    if (data) {
      setSelectedProduct(data)
    }

    await fetchMovements(selectedProduct.id)

  setAmount(0)
setHasAdjustmentAmount(false)
setAdjustmentReason('')
setAdjustmentNote('')
setWeightInputUnit('kg')
setAdjustmentMode('entry')
setIsAdjustmentOpen(false)
} finally {
  setIsAdjustingStock(false)
}
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

const formatQuantityValue = (
  value: number,
  product: Product
) => {
const sign = value < 0 ? '-' : ''
const absoluteValue = Math.abs(value)

if (product.sale_type === 'weight') {
  const totalGrams = Math.round(
    absoluteValue * 1000
  )
    const kilograms = Math.floor(totalGrams / 1000)
    const grams = totalGrams % 1000

    if (kilograms === 0) {
  return `${sign}${grams} g`
}

if (grams === 0) {
  return `${sign}${kilograms} kg`
}

return `${sign}${kilograms} kg ${grams} g`
  }

  const quantity = absoluteValue.toLocaleString('es-AR', {
    maximumFractionDigits: 3
  })

  return `${sign}${quantity} ${
  absoluteValue === 1 ? 'unidad' : 'unidades'
}`
}

const formatStockQuantity = (product: Product) => {
  return formatQuantityValue(product.stock_quantity, product)
}

const allAttentionProducts = products
  .map((product) => ({
    product,
    info: getAttentionInfo(product)
  }))
  .filter(
    (
      item
    ): item is {
      product: Product
      info: AttentionInfo
    } => item.info !== null
  )
  .sort((a, b) => {
    const priorityDifference =
      a.info.priority - b.info.priority

    if (priorityDifference !== 0) {
      return priorityDifference
    }

    const aExpirationDays =
  getExpirationDays(a.product)

const bExpirationDays =
  getExpirationDays(b.product)

if (
  aExpirationDays !== null ||
  bExpirationDays !== null
) {
  const expirationDifference =
    (
      aExpirationDays ??
      Number.POSITIVE_INFINITY
    ) -
    (
      bExpirationDays ??
      Number.POSITIVE_INFINITY
    )

  if (expirationDifference !== 0) {
    return expirationDifference
  }
}

    return (
      a.product.stock_quantity -
      b.product.stock_quantity
    )
  })

const attentionProducts =
  allAttentionProducts.slice(0, 3)

const getMovementLabel = (movement: StockMovement) => {
  const reason = movement.reason || ''

  if (reason === 'Venta') return 'Venta'
  if (reason === 'Ingreso manual') return 'Entrada'
  if (reason === 'Ajuste manual') return 'Ajuste'
  if (reason === 'Stock inicial') return 'Stock inicial'

  if (reason.startsWith('Entrada:')) return 'Entrada'
  if (reason.startsWith('Salida:')) return 'Salida'
  if (reason.startsWith('Ajuste:')) return 'Ajuste'

  return reason || 'Movimiento'
}

const getMovementDetail = (
  movement: StockMovement
) => {
  const reason = movement.reason || ''

  if (
    [
      'Venta',
      'Ingreso manual',
      'Ajuste manual',
      'Stock inicial'
    ].includes(reason)
  ) {
    return null
  }

  const separatorPosition = reason.indexOf(':')

  if (separatorPosition !== -1) {
    return reason
      .slice(separatorPosition + 1)
      .trim()
  }

  return null
}

const getMovementCategory = (
  movement: StockMovement
): HistoryFilter => {
  const reason = movement.reason || ''

  if (reason === 'Venta') return 'sales'

  if (
    reason === 'Stock inicial' ||
    reason === 'Ingreso manual' ||
    reason.startsWith('Entrada:')
  ) {
    return 'entries'
  }

  if (reason.startsWith('Salida:')) {
    return 'exits'
  }

  if (
    reason === 'Ajuste manual' ||
    reason.startsWith('Ajuste:')
  ) {
    return 'adjustments'
  }

  return movement.change >= 0
    ? 'entries'
    : 'exits'
}

const formatMovementChange = (
  movement: StockMovement,
  product: Product
) => {
  const formattedQuantity = formatQuantityValue(
    Math.abs(movement.change),
    product
  )

  return `${movement.change > 0 ? '+' : '-'}${formattedQuantity}`
}

const formatProductPrice = (product: Product) => {
  const price = Number(product.price || 0).toLocaleString('es-AR')
  const priceUnit =
    product.sale_type === 'weight' ? '100 g' : 'unidad'

  return `$${price} / ${priceUnit}`
}

const getProductPresentation = (product: Product) => {
  return [product.brand, product.quantity]
    .filter((value) => String(value ?? '').trim())
    .join(' · ')
}

const getExpirationInfo = (product: Product) => {
  if (!product.expiration_date) return null

  const datePart =
    product.expiration_date.split('T')[0]

  const [year, month, day] = datePart
    .split('-')
    .map(Number)

  if (!year || !month || !day) return null

  const expirationDate = new Date(
    year,
    month - 1,
    day
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const differenceInDays = Math.ceil(
    (
      expirationDate.getTime() -
      today.getTime()
    ) /
      86400000
  )

  const formattedDate =
    expirationDate.toLocaleDateString('es-AR')

  if (differenceInDays < 0) {
    return {
      date: formattedDate,
      message: `Venció hace ${Math.abs(
        differenceInDays
      )} días`,
      textClass: 'text-red-400'
    }
  }

  if (differenceInDays === 0) {
    return {
      date: formattedDate,
      message: 'Vence hoy',
      textClass: 'text-red-400'
    }
  }

  if (differenceInDays === 1) {
    return {
      date: formattedDate,
      message: 'Vence mañana',
      textClass: 'text-orange-400'
    }
  }

  return {
    date: formattedDate,
    message: `Faltan ${differenceInDays} días`,
    textClass:
      differenceInDays <= 7
        ? 'text-orange-400'
        : differenceInDays <= 30
        ? 'text-yellow-400'
        : 'text-gray-300'
  }
}

const filteredMovements =
  historyFilter === 'all'
    ? movements
    : movements.filter(
        (movement) =>
          getMovementCategory(movement) ===
          historyFilter
      )

      const getArgentinaDayKey = (
  value: string | Date
) => {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  const parts = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'America/Argentina/Cordoba',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).formatToParts(date)

  const year = parts.find(
    (part) => part.type === 'year'
  )?.value

  const month = parts.find(
    (part) => part.type === 'month'
  )?.value

  const day = parts.find(
    (part) => part.type === 'day'
  )?.value

  return `${year}-${month}-${day}`
}

const getMovementDayLabel = (
  movement: StockMovement
) => {
  const movementDate =
    new Date(movement.created_at)

  const movementKey =
    getArgentinaDayKey(movementDate)

  const today = new Date()
  const todayKey =
    getArgentinaDayKey(today)

  const yesterday = new Date(
    today.getTime() - 86400000
  )

  const yesterdayKey =
    getArgentinaDayKey(yesterday)

  if (movementKey === todayKey) {
    return 'Hoy'
  }

  if (movementKey === yesterdayKey) {
    return 'Ayer'
  }

  return movementDate.toLocaleDateString(
    'es-AR',
    {
      timeZone: 'America/Argentina/Cordoba',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  )
}

const groupedMovements =
  filteredMovements.reduce(
    (
      groups: Record<
        string,
        StockMovement[]
      >,
      movement
    ) => {
      const label =
        getMovementDayLabel(movement)

      if (!groups[label]) {
        groups[label] = []
      }

      groups[label].push(movement)

      return groups
    },
    {}
  )

  return (
    
    <div className="p-4 md:p-6 space-y-5 md:space-y-8">

{/* ================= HEADER MOBILE ================= */}
<div className="md:hidden">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
        Inventario
      </p>

      <h1 className="text-2xl font-bold text-white mt-1">
        Control de Stock
      </h1>

      <p className="text-gray-400 text-sm mt-1">
        Revisá existencias, vencimientos y movimientos.
      </p>
    </div>

    <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl shrink-0">
      📦
    </div>
  </div>

  <div
    className={`mt-4 rounded-xl border px-4 py-3 ${
      allAttentionProducts.length > 0
        ? 'border-orange-500/20 bg-orange-500/5'
        : 'border-green-500/20 bg-green-500/5'
    }`}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p
          className={`text-sm font-semibold ${
            allAttentionProducts.length > 0
              ? 'text-orange-400'
              : 'text-green-400'
          }`}
        >
          {allAttentionProducts.length > 0
            ? 'Hay productos para revisar'
            : 'Todo bajo control'}
        </p>

        <p className="text-gray-400 text-xs mt-1">
          {allAttentionProducts.length > 0
            ? `${allAttentionProducts.length} ${
                allAttentionProducts.length === 1
                  ? 'producto necesita'
                  : 'productos necesitan'
              } tu atención.`
            : 'No hay problemas de stock ni vencimientos próximos.'}
        </p>
      </div>

      <span
        className={`text-xl ${
          allAttentionProducts.length > 0
            ? 'text-orange-400'
            : 'text-green-400'
        }`}
        aria-hidden="true"
      >
        {allAttentionProducts.length > 0 ? '!' : '✓'}
      </span>
    </div>
  </div>
</div>

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

{/* ================= MÉTRICAS MOBILE ================= */}
<div className="md:hidden grid grid-cols-2 gap-3">
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-gray-400 text-xs">
        Productos
      </p>

      <span className="text-sm" aria-hidden="true">
        📦
      </span>
    </div>

    <p className="text-white text-2xl font-bold mt-2">
      {products.length}
    </p>

    <p className="text-gray-500 text-xs mt-1">
      Activos
    </p>
  </div>

  <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-3.5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-gray-400 text-xs">
        Sin stock
      </p>

      <span className="text-red-400 text-sm" aria-hidden="true">
        ⛔
      </span>
    </div>

    <p className="text-red-400 text-2xl font-bold mt-2">
      {outOfStockProducts}
    </p>

    <p className="text-gray-500 text-xs mt-1">
      Sin existencias
    </p>
  </div>

  <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-3.5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-gray-400 text-xs">
        Críticos
      </p>

      <span className="text-orange-400 text-sm" aria-hidden="true">
        🚨
      </span>
    </div>

    <p className="text-orange-400 text-2xl font-bold mt-2">
      {criticalProducts}
    </p>

    <p className="text-gray-500 text-xs mt-1">
      Reposición urgente
    </p>
  </div>

  <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-3.5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-gray-400 text-xs">
        Bajo stock
      </p>

      <span className="text-yellow-400 text-sm" aria-hidden="true">
        ⚠️
      </span>
    </div>

    <p className="text-yellow-400 text-2xl font-bold mt-2">
      {alertProducts}
    </p>

    <p className="text-gray-500 text-xs mt-1">
      Conviene revisar
    </p>
  </div>
</div>

{/* ================= NECESITAN TU ATENCIÓN MOBILE ================= */}
{allAttentionProducts.length > 0 && (
  <div className="md:hidden bg-gray-900 border border-gray-800 rounded-2xl p-4">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-white font-semibold">
          Necesitan tu atención
        </h2>

        <p className="text-gray-400 text-xs mt-1">
          Revisá primero estos productos.
        </p>
      </div>

      <span className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full shrink-0">
        {allAttentionProducts.length}
      </span>
    </div>

    <div className="space-y-2">
      {attentionProducts.map(({ product, info }) => (
        <button
          key={product.id}
          type="button"
          onClick={() => {
            setSelectedProduct(product)
            fetchMovements(product.id)
          }}
          className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-left active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="text-lg"
                  aria-hidden="true"
                >
                  📦
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">
                {product.name}
              </p>

              {getProductPresentation(product) && (
                <p className="text-gray-500 text-xs mt-1 truncate">
                  {getProductPresentation(product)}
                </p>
              )}
            </div>

            <span className="text-gray-500 text-xl shrink-0">
              ›
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="text-gray-400 text-xs truncate">
              {info.detail}
            </p>

            <span
              className={`text-[11px] font-medium border px-2 py-1 rounded-full whitespace-nowrap ${info.badgeClass}`}
            >
              {info.label}
            </span>
          </div>
        </button>
      ))}
    </div>

    {allAttentionProducts.length > 3 && (
      <p className="text-gray-500 text-xs text-center mt-3">
        Se muestran los 3 casos más urgentes.
      </p>
    )}
  </div>
)}

      {/* ================= KPI CARDS ================= */}
<div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

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
      {allAttentionProducts.length}{' '}
{allAttentionProducts.length === 1
  ? 'prioritario'
  : 'prioritarios'}
    </span>
  </div>

  {allAttentionProducts.length === 0 ? (
    <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-4">
      <p className="text-green-400 font-medium">
        Todo bajo control
      </p>

      <p className="text-gray-400 text-sm mt-1">
        No hay problemas de stock ni vencimientos próximos.
      </p>
    </div>
  ) : (
    <div className="space-y-2">
      {attentionProducts.map(({ product, info }) => {
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
            <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
  {product.image_url ? (
    <img
      src={product.image_url}
      alt={product.name}
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-lg" aria-hidden="true">
      📦
    </span>
  )}
</div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium truncate">
                {product.name}
              </p>

              <p className="text-gray-400 text-sm mt-1">
               {info.detail}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-xs font-medium border px-2.5 py-1 rounded-full ${info.badgeClass}`}
              >
                {info.label}
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
    Inventario
  </h2>

  <input
    type="text"
    placeholder="🔎 Buscar por nombre, marca, presentación o código..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
      }
    }}
    className="
      w-full md:w-[380px]
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
  { label: 'Sin stock', value: 'out' },
  { label: 'Críticos', value: 'critical' },
  { label: 'Bajo stock', value: 'alert' },
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

         <div className="max-h-[350px] md:max-h-[620px] overflow-y-auto overscroll-contain pr-2 space-y-3">


       {products
  .filter((product) => {
   if (!matchesProductSearch(product)) return false

    return matchesStockFilter(product)
  })
  .map((product) => {
      const status = getStockStatus(product)

      const statusInfo =
  getStockStatusInfo(product)

const color =
  status === 'red'
    ? 'bg-red-500'
    : status === 'yellow'
    ? 'bg-yellow-400'
    : 'bg-green-500'

   const statusLabel = statusInfo.label

const statusTextColor =
  statusInfo.textClass

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
    rounded-xl md:rounded-2xl
    px-3 py-3 md:px-4 md:py-4
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

<div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
  {product.image_url ? (
    <img
      src={product.image_url}
      alt={product.name}
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-xl" aria-hidden="true">
      📦
    </span>
  )}
</div>
<div className="min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_180px_120px] items-center gap-x-3 gap-y-1 md:gap-4">
  <div className="min-w-0 row-span-2 md:row-span-1">
    <p className="text-white font-semibold leading-tight truncate">
      {product.name}
    </p>

    {getProductPresentation(product) && (
      <p className="text-gray-500 text-xs mt-1 truncate">
        {getProductPresentation(product)}
      </p>
    )}
  </div>

  <div className="text-right md:text-left">
    <p className="hidden md:block text-gray-500 text-xs">
      Stock real
    </p>

    <p className="text-white text-sm font-medium md:mt-1">
      {formatStockQuantity(product)}
    </p>
  </div>

  <div className="flex items-center justify-end gap-1.5">
    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />

    <p className={`text-xs font-medium ${statusTextColor}`}>
      {statusLabel}
    </p>
  </div>
</div>

<span className="md:hidden text-gray-500 text-xl shrink-0">
  ›
</span>
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
      {/* Producto seleccionado */}
<div>
  <p className="text-gray-400 text-sm font-medium">
    Producto seleccionado
  </p>

  <div className="flex items-center gap-4 mt-4">
    <div className="w-20 h-20 rounded-2xl bg-[#111827] border border-[#1F2937] overflow-hidden shrink-0 flex items-center justify-center">
      {selectedProduct.image_url ? (
        <img
          src={selectedProduct.image_url}
          alt={selectedProduct.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-3xl" aria-hidden="true">
          📦
        </span>
      )}
    </div>

    <div className="min-w-0">
      <h2 className="text-white text-lg font-semibold leading-tight">
        {selectedProduct.name}
      </h2>

      {getProductPresentation(selectedProduct) ? (
        <p className="text-gray-400 text-sm mt-1">
          {getProductPresentation(selectedProduct)}
        </p>
      ) : (
        <p className="text-gray-400 text-sm mt-1">
          {selectedProduct.sale_type === 'weight'
            ? 'Producto por peso'
            : 'Producto por unidad'}
        </p>
      )}
    </div>
  </div>
</div>

    {/* Stock y datos principales */}
<div className="space-y-4">
  {(() => {
    const statusInfo = getStockStatusInfo(selectedProduct)

    return (
      <>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
          <p className="text-gray-400 text-sm">
            Stock actual
          </p>

          <div className="flex items-end justify-between gap-3 mt-2">
            <p className="text-3xl font-bold text-white leading-none">
              {formatStockQuantity(selectedProduct)}
            </p>

            <span
              className={`text-xs font-medium border px-2.5 py-1 rounded-full shrink-0 ${statusInfo.badgeClass}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl divide-y divide-[#1F2937]">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-gray-400 text-sm">
              Stock mínimo
            </p>

            <p className="text-white text-sm font-medium text-right">
              {formatQuantityValue(
                selectedProduct.min_stock_yellow,
                selectedProduct
              )}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-gray-400 text-sm">
              Crítico desde
            </p>

            <p className="text-white text-sm font-medium text-right">
              {formatQuantityValue(
                selectedProduct.min_stock_red,
                selectedProduct
              )}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-gray-400 text-sm">
              Precio de venta
            </p>

            <p className="text-white text-sm font-medium text-right">
              {formatProductPrice(selectedProduct)}
            </p>
          </div>

<div className="flex items-center justify-between gap-4 px-4 py-3">
  <p className="text-gray-400 text-sm">
    Vencimiento
  </p>

  {(() => {
    const expirationInfo =
      getExpirationInfo(selectedProduct)

    return expirationInfo ? (
      <div className="text-right">
        <p className="text-white text-sm font-medium">
          {expirationInfo.date}
        </p>

        <p
          className={`text-xs mt-1 ${expirationInfo.textClass}`}
        >
          {expirationInfo.message}
        </p>
      </div>
    ) : (
      <p className="text-gray-500 text-sm text-right">
        Sin vencimiento registrado
      </p>
    )
  })()}
</div>

        </div>
      </>
    )
  })()}
</div>

{/* Último movimiento */}
<div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
  <p className="text-gray-400 text-sm">
    Último movimiento
  </p>

  {loadingMovements ? (
    <p className="text-gray-500 text-sm mt-3">
      Cargando...
    </p>
  ) : movements.length === 0 ? (
    <p className="text-gray-500 text-sm mt-3">
      No hay movimientos registrados.
    </p>
  ) : (
    (() => {
      const lastMovement = movements[0]

      return (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-white text-sm font-medium">
              {getMovementLabel(lastMovement)}
            </p>

            <p
              className={`text-sm font-semibold ${
                lastMovement.change < 0
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}
            >
              {formatMovementChange(
                lastMovement,
                selectedProduct
              )}
            </p>
          </div>

          <p className="text-gray-500 text-xs mt-2">
            {new Date(lastMovement.created_at).toLocaleString(
              'es-AR',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }
            )}
          </p>
        </div>

      )
    })()
  )}
</div>

<div className="space-y-3">
  <button
    type="button"
    onClick={() => {
      setAmount(0)
      setHasAdjustmentAmount(false)
      setAdjustmentMode('entry')
      setAdjustmentReason('')
      setAdjustmentNote('')
      setWeightInputUnit('kg')
      setAdjustmentError('')
      setIsAdjustmentOpen(true)
    }}
    className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-blue-500 transition"
  >
    Ajustar stock
  </button>

  <button
    type="button"
    onClick={() => setIsHistoryOpen(true)}
    className="w-full border border-gray-700 text-gray-300 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-800 hover:text-white transition"
  >
    Ver historial
  </button>
</div>
    </>
  )}
</div>

</div>

{/* ================= AJUSTE DE STOCK WEB + MOBILE ================= */}
{isAdjustmentOpen && selectedProduct && (
  <div
   
  className="fixed inset-0 z-[1300] bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6"
    onClick={() => setIsAdjustmentOpen(false)}
  >
    <div
     className="w-full max-w-2xl max-h-[92vh] lg:max-h-[90vh] bg-[#0F172A] border border-[#1E293B] rounded-t-3xl lg:rounded-2xl shadow-2xl overflow-y-auto overscroll-contain"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 lg:px-6 py-4 lg:py-5 bg-[#0F172A] border-b border-[#1E293B]">
        <div>
          <h2 className="text-white text-xl font-semibold">
            Ajustar stock
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Registrá un cambio y conservá su historial.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdjustmentOpen(false)}
          className="w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          aria-label="Cerrar ajuste de stock"
        >
          ✕
        </button>
      </div>

      <div className="p-4 lg:p-6">
        {/* Producto y stock */}
<div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
        {selectedProduct.image_url ? (
          <img
            src={selectedProduct.image_url}
            alt={selectedProduct.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="text-xl lg:text-2xl"
            aria-hidden="true"
          >
            📦
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-white text-sm lg:text-base font-semibold truncate">
          {selectedProduct.name}
        </p>

        <p className="text-gray-400 text-xs lg:text-sm mt-1 truncate">
          {getProductPresentation(selectedProduct) ||
            (selectedProduct.sale_type === 'weight'
              ? 'Producto por peso'
              : 'Producto por unidad')}
        </p>
      </div>
    </div>

    <div className="text-right shrink-0">
      <p className="text-gray-500 text-xs">
        Stock actual
      </p>

      <p className="text-white text-base lg:text-xl font-bold mt-1">
        {formatStockQuantity(selectedProduct)}
      </p>
    </div>
  </div>
</div>

{/* Precio y vencimiento */}
<div className="grid grid-cols-2 gap-3 mt-3">
  <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 lg:px-4 py-3">
    <p className="text-gray-500 text-xs">
      Precio de venta
    </p>

    <p className="text-white text-xs lg:text-sm font-medium mt-1">
      {formatProductPrice(selectedProduct)}
    </p>
  </div>

  <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 lg:px-4 py-3">
    <p className="text-gray-500 text-xs">
      Vencimiento
    </p>

    {(() => {
      const expirationInfo =
        getExpirationInfo(selectedProduct)

      return expirationInfo ? (
        <>
          <p className="text-white text-xs lg:text-sm font-medium mt-1">
            {expirationInfo.date}
          </p>

          <p
            className={`text-[11px] lg:text-xs mt-1 ${expirationInfo.textClass}`}
          >
            {expirationInfo.message}
          </p>
        </>
      ) : (
        <p className="text-gray-500 text-[11px] lg:text-sm mt-1">
          Sin vencimiento
        </p>
      )
    })()}
  </div>
</div>

{/* Tipo de ajuste */}
<div className="mt-5 lg:mt-6">
  <p className="text-white text-sm font-medium mb-3">
    ¿Qué necesitás hacer?
  </p>

  <div className="grid grid-cols-3 gap-2 lg:gap-3">
    {[
      {
        value: 'entry',
        label: 'Entrada',
        description: 'Ingresó mercadería',
        icon: '+'
      },
      {
        value: 'exit',
        label: 'Salida',
        description: 'Merma, rotura o consumo',
        icon: '−'
      },
      {
        value: 'correction',
        label: 'Corrección',
        description: 'Conteo físico',
        icon: '✎'
      }
    ].map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => {
          setAdjustmentMode(
            option.value as StockAdjustmentMode
          )
          setAmount(0)
          setHasAdjustmentAmount(false)
          setAdjustmentReason('')
          setAdjustmentNote('')
          setAdjustmentError('')
        }}
        className={`rounded-xl border p-3 lg:p-4 text-center lg:text-left transition active:scale-[0.98] ${
          adjustmentMode === option.value
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 bg-[#111827] hover:bg-gray-800'
        }`}
      >
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-base font-bold ${
            adjustmentMode === option.value
              ? 'text-blue-400 bg-blue-500/10'
              : 'text-gray-400 bg-gray-800'
          }`}
        >
          {option.icon}
        </span>

        <p className="text-white text-xs lg:text-sm font-medium mt-2">
          {option.label}
        </p>

        <p className="hidden lg:block text-gray-500 text-xs mt-1">
          {option.description}
        </p>
      </button>
    ))}
  </div>
</div>

{/* Cantidad */}
<div className="mt-5 lg:mt-6">
  <label
    htmlFor="stock-adjustment-amount"
    className="block text-white text-sm font-medium mb-2"
  >
    {adjustmentMode === 'entry'
      ? 'Cantidad que ingresa'
      : adjustmentMode === 'exit'
      ? 'Cantidad que sale'
      : 'Stock físico contado'}
  </label>

  <div className="flex">
    <input
      id="stock-adjustment-amount"
      type="number"
      inputMode="decimal"
      min="0"
      step={
        selectedProduct.sale_type === 'weight'
          ? weightInputUnit === 'g'
            ? '1'
            : '0.001'
          : '1'
      }
      value={amount}
      onChange={(event) => {
        setAmount(Number(event.target.value))
        setHasAdjustmentAmount(true)
        setAdjustmentError('')
      }}
      className={`w-full bg-[#111827] border border-gray-700 px-4 py-3 text-white focus:outline-none focus:border-blue-500 ${
        selectedProduct.sale_type === 'weight'
          ? 'rounded-l-xl'
          : 'rounded-xl'
      }`}
    />

    {selectedProduct.sale_type === 'weight' && (
      <select
        value={weightInputUnit}
        onChange={(event) => {
          setWeightInputUnit(
            event.target.value as WeightInputUnit
          )
          setAdjustmentError('')
        }}
        className="bg-gray-800 border border-l-0 border-gray-700 rounded-r-xl px-4 text-white focus:outline-none focus:border-blue-500"
      >
        <option value="kg">kg</option>
        <option value="g">g</option>
      </select>
    )}
  </div>

  <p className="text-gray-500 text-xs mt-2">
    {adjustmentMode === 'correction'
      ? 'Ingresá la cantidad real que contaste.'
      : selectedProduct.sale_type === 'weight'
      ? 'Podés cargar la cantidad en kilos o gramos.'
      : 'Ingresá una cantidad de unidades enteras.'}
  </p>
</div>

{/* Motivo y nota */}
<div className="mt-5 space-y-4">
  <div>
    <label
      htmlFor="stock-adjustment-reason"
      className="block text-white text-sm font-medium mb-2"
    >
      Motivo
      <span className="text-red-400 ml-1">*</span>
    </label>

    <select
      id="stock-adjustment-reason"
      value={adjustmentReason}
      onChange={(event) => {
        setAdjustmentReason(event.target.value)
        setAdjustmentError('')
      }}
      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
    >
      <option value="">
        Seleccioná un motivo
      </option>

      {adjustmentReasons.map((reason) => (
        <option key={reason} value={reason}>
          {reason}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label
      htmlFor="stock-adjustment-note"
      className="block text-white text-sm font-medium mb-2"
    >
      Nota
      <span className="text-gray-500 font-normal ml-1">
        (opcional)
      </span>
    </label>

    <textarea
      id="stock-adjustment-note"
      value={adjustmentNote}
      onChange={(event) =>
        setAdjustmentNote(event.target.value)
      }
      placeholder="Ej.: Pedido recibido completo"
      rows={2}
      maxLength={180}
      className="w-full resize-none bg-[#111827] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
    />
  </div>
</div>

{/* Previsualización */}
{hasAdjustmentAmount && (
  <div className="mt-5">
    {(() => {
      const stockChange = getAdjustmentChange()
      const resultingStock = getResultingStock()
      const isInvalid = resultingStock < 0

      return (
        <div
          className={`rounded-xl border p-4 ${
            isInvalid
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-green-500/30 bg-green-500/5'
          }`}
        >
          <p className="text-gray-400 text-xs">
            Stock resultante
          </p>

          <div className="flex items-center flex-wrap gap-2 mt-2 text-sm font-semibold">
            {adjustmentMode === 'correction' ? (
              <>
                <span className="text-gray-400">
                  Stock contado:
                </span>

                <span
                  className={
                    isInvalid
                      ? 'text-red-400'
                      : 'text-green-400'
                  }
                >
                  {formatQuantityValue(
                    resultingStock,
                    selectedProduct
                  )}
                </span>
              </>
            ) : (
              <>
                <span className="text-white">
                  {formatStockQuantity(selectedProduct)}
                </span>

                <span
                  className={
                    stockChange < 0
                      ? 'text-red-400'
                      : 'text-green-400'
                  }
                >
                  {stockChange < 0 ? '−' : '+'}
                </span>

                <span className="text-white">
                  {formatQuantityValue(
                    Math.abs(stockChange),
                    selectedProduct
                  )}
                </span>

                <span className="text-gray-500">
                  =
                </span>

                <span
                  className={
                    isInvalid
                      ? 'text-red-400'
                      : 'text-green-400'
                  }
                >
                  {formatQuantityValue(
                    resultingStock,
                    selectedProduct
                  )}
                </span>
              </>
            )}
          </div>

          <p className="text-gray-500 text-xs mt-3">
            Este movimiento quedará registrado en el historial.
          </p>
        </div>
      )
    })()}
  </div>
)}

{/* Error */}
{adjustmentError && (
  <div className="mt-4 border border-red-500/30 bg-red-500/10 rounded-xl px-4 py-3">
    <p className="text-red-400 text-sm">
      {adjustmentError}
    </p>
  </div>
)}

{/* Acciones */}
<div className="sticky bottom-0 z-10 grid grid-cols-2 gap-3 mt-6 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-4 pb-4 bg-[#0F172A] border-t border-[#1E293B]">
  <button
    type="button"
    onClick={() => {
      setIsAdjustmentOpen(false)
      setAmount(0)
      setHasAdjustmentAmount(false)
      setAdjustmentReason('')
      setAdjustmentNote('')
      setAdjustmentError('')
      setWeightInputUnit('kg')
      setAdjustmentMode('entry')
    }}
    disabled={isAdjustingStock}
   className="w-full border border-gray-700 text-gray-300 rounded-xl px-3 lg:px-5 py-3 text-sm font-medium hover:bg-gray-800 hover:text-white transition disabled:opacity-50"
  >
    Cancelar
  </button>

  <button
    type="button"
    onClick={addStock}
    disabled={isAdjustingStock}
   className="w-full bg-blue-600 text-white rounded-xl px-3 lg:px-5 py-3 text-sm font-semibold hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isAdjustingStock
      ? 'Guardando...'
      : adjustmentMode === 'entry'
      ? 'Confirmar entrada'
      : adjustmentMode === 'exit'
      ? 'Confirmar salida'
      : 'Confirmar corrección'}
  </button>
</div>

      </div>
    </div>
  </div>
)}

{/* ================= HISTORIAL WEB + MOBILE ================= */}
{isHistoryOpen && selectedProduct && (
  <div
   className="fixed inset-0 z-[1400] bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6"
    onClick={() => setIsHistoryOpen(false)}
  >
    <div
     className="w-full max-w-4xl max-h-[92vh] lg:max-h-[85vh] bg-[#0F172A] border border-[#1E293B] rounded-t-3xl lg:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="shrink-0 flex items-start justify-between gap-4 px-5 lg:px-6 py-4 lg:py-5 bg-[#0F172A] border-b border-[#1E293B]">
        <div>
          <h2 className="text-white text-xl font-semibold">
            Historial de stock
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Revisá los movimientos registrados de este producto.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsHistoryOpen(false)}
          className="w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          aria-label="Cerrar historial"
        >
          ✕
        </button>
      </div>

      <div className="p-4 lg:p-6 overflow-y-auto overscroll-contain">
      {/* Producto y stock */}
<div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
        {selectedProduct.image_url ? (
          <img
            src={selectedProduct.image_url}
            alt={selectedProduct.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="text-xl lg:text-2xl"
            aria-hidden="true"
          >
            📦
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-white text-sm lg:text-base font-semibold truncate">
          {selectedProduct.name}
        </p>

        <p className="text-gray-400 text-xs lg:text-sm mt-1 truncate">
          {getProductPresentation(selectedProduct) ||
            (selectedProduct.sale_type === 'weight'
              ? 'Producto por peso'
              : 'Producto por unidad')}
        </p>
      </div>
    </div>

    <div className="text-right shrink-0">
      <p className="text-gray-500 text-xs">
        Stock actual
      </p>

      <p className="text-white text-base lg:text-xl font-bold mt-1">
        {formatStockQuantity(selectedProduct)}
      </p>
    </div>
  </div>
</div>

{/* Precio y vencimiento */}
<div className="grid grid-cols-2 gap-3 mt-3">
  <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 lg:px-4 py-3">
    <p className="text-gray-500 text-xs">
      Precio de venta
    </p>

    <p className="text-white text-xs lg:text-sm font-medium mt-1">
      {formatProductPrice(selectedProduct)}
    </p>
  </div>

  <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 lg:px-4 py-3">
    <p className="text-gray-500 text-xs">
      Vencimiento
    </p>

    {(() => {
      const expirationInfo =
        getExpirationInfo(selectedProduct)

      return expirationInfo ? (
        <>
          <p className="text-white text-xs lg:text-sm font-medium mt-1">
            {expirationInfo.date}
          </p>

          <p
            className={`text-[11px] lg:text-xs mt-1 ${expirationInfo.textClass}`}
          >
            {expirationInfo.message}
          </p>
        </>
      ) : (
        <p className="text-gray-500 text-[11px] lg:text-sm mt-1">
          Sin vencimiento
        </p>
      )
    })()}
  </div>
</div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 mt-5">
  <div className="flex gap-2 max-w-full overflow-x-auto overscroll-x-contain pb-1">
    {[
      { label: 'Todos', value: 'all' },
      { label: 'Ventas', value: 'sales' },
      { label: 'Entradas', value: 'entries' },
      { label: 'Salidas', value: 'exits' },
      { label: 'Ajustes', value: 'adjustments' }
    ].map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() =>
          setHistoryFilter(
            option.value as HistoryFilter
          )
        }
        className={`min-h-9 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
          historyFilter === option.value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>

  <p className="text-gray-500 text-xs text-right lg:text-left shrink-0">
    {filteredMovements.length}{' '}
    {filteredMovements.length === 1
      ? 'movimiento'
      : 'movimientos'}
  </p>
</div>

{/* Movimientos agrupados */}
<div className="mt-4 border border-[#1F2937] rounded-xl overflow-hidden">
  {/* Encabezado Web */}
  <div className="hidden lg:grid grid-cols-[150px_minmax(0,1fr)_140px] gap-4 bg-gray-800/60 px-4 py-3 text-xs text-gray-400">
    <p>Hora</p>
    <p>Movimiento</p>
    <p className="text-right">
      Cambio
    </p>
  </div>

  {loadingMovements ? (
    <p className="text-gray-500 text-sm px-4 py-6">
      Cargando movimientos...
    </p>
  ) : filteredMovements.length === 0 ? (
    <div className="px-4 py-8 text-center">
      <p className="text-gray-400 text-sm">
        No hay movimientos en esta categoría.
      </p>

      <p className="text-gray-600 text-xs mt-1">
        Probá seleccionando otro filtro.
      </p>
    </div>
  ) : (
    <div className="max-h-[360px] lg:max-h-[380px] overflow-y-auto overscroll-contain">
      {Object.entries(groupedMovements).map(
        ([dayLabel, dayMovements]) => (
          <div key={dayLabel}>
            {/* Separador de día */}
            <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 bg-[#172033] border-y border-[#1F2937] px-4 py-2.5">
              <p className="text-white text-xs font-semibold">
                {dayLabel}
              </p>

              <p className="text-gray-500 text-[11px]">
                {dayMovements.length}{' '}
                {dayMovements.length === 1
                  ? 'movimiento'
                  : 'movimientos'}
              </p>
            </div>

            <div className="divide-y divide-[#1F2937]">
              {dayMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[150px_minmax(0,1fr)_140px] items-center gap-3 lg:gap-4 px-4 py-3"
                >
                  {/* Hora Web */}
                  <p className="hidden lg:block text-gray-400 text-xs">
                    {new Date(
                      movement.created_at
                    ).toLocaleTimeString(
                      'es-AR',
                      {
                        timeZone:
                          'America/Argentina/Cordoba',
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )}
                  </p>

                  {/* Movimiento */}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {getMovementLabel(movement)}
                    </p>

                    {getMovementDetail(
                      movement
                    ) && (
                      <p className="text-gray-500 text-xs mt-1 truncate">
                        {getMovementDetail(
                          movement
                        )}
                      </p>
                    )}

                    {/* Hora Mobile */}
                    <p className="lg:hidden text-gray-500 text-xs mt-1">
                      {new Date(
                        movement.created_at
                      ).toLocaleTimeString(
                        'es-AR',
                        {
                          timeZone:
                            'America/Argentina/Cordoba',
                          hour: '2-digit',
                          minute: '2-digit'
                        }
                      )}
                    </p>
                  </div>

                  {/* Cantidad */}
                  <p
                    className={`text-sm font-semibold text-right shrink-0 ${
                      movement.change < 0
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {formatMovementChange(
                      movement,
                      selectedProduct
                    )}
                  </p>
                </div>
              ))}
            </div>
            
          </div>
        )
      )}
    </div>
  )}
</div>
{/* Carga progresiva */}
{!loadingMovements &&
  movements.length > 0 && (
    <div className="flex items-center justify-between gap-4 mt-4">
      <p className="text-gray-500 text-xs">
        {movements.length}{' '}
        {movements.length === 1
          ? 'movimiento cargado'
          : 'movimientos cargados'}
      </p>

      {hasMoreMovements && (
        <button
          type="button"
          onClick={() =>
            fetchMovements(
              selectedProduct.id,
              movementPage + 1
            )
          }
          disabled={loadingMoreMovements}
          className="border border-gray-700 bg-gray-800 text-gray-300 rounded-xl px-4 py-2.5 text-xs font-medium hover:bg-gray-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingMoreMovements
            ? 'Cargando...'
            : 'Cargar anteriores'}
        </button>
      )}
    </div>
  )}
      </div>
    </div>
  </div>
)}

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
  className="w-full max-h-[90vh] bg-[#111827] border-t border-[#263247] rounded-t-3xl overflow-hidden flex flex-col"
  onClick={(event) => {
    event.stopPropagation()
  }}
>
      {/* Indicador superior */}
      <div className="flex justify-center pt-3">
        <div className="w-12 h-1.5 rounded-full bg-gray-700" />
      </div>

      {/* Encabezado Mobile */}
<div className="flex items-center gap-3 px-5 pt-4 pb-5 border-b border-gray-800">
  <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
    {selectedProduct.image_url ? (
      <img
        src={selectedProduct.image_url}
        alt={selectedProduct.name}
        className="w-full h-full object-cover"
      />
    ) : (
      <span
        className="text-2xl"
        aria-hidden="true"
      >
        📦
      </span>
    )}
  </div>

  <div className="min-w-0 flex-1">
    <p className="text-blue-400 text-[11px] font-semibold uppercase tracking-wider">
      Detalle del producto
    </p>

    <h2 className="text-lg font-bold text-white leading-tight mt-1 truncate">
      {selectedProduct.name}
    </h2>

    <p className="text-gray-400 text-xs mt-1 truncate">
      {getProductPresentation(selectedProduct) ||
        (selectedProduct.sale_type === 'weight'
          ? 'Producto por peso'
          : 'Producto por unidad')}
    </p>
  </div>

  <button
    type="button"
    onClick={() => {
      setSelectedProduct(null)
      setMovements([])
    }}
    className="w-10 h-10 shrink-0 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center text-lg active:scale-95 transition"
    aria-label="Cerrar detalle"
  >
    ✕
  </button>
</div>

      {/* Contenido desplazable */}
      <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

        {/* Resumen de stock Mobile */}
<div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-gray-400 text-xs">
        Stock actual
      </p>

      <p className="text-white text-3xl font-bold mt-1">
        {formatStockQuantity(selectedProduct)}
      </p>
    </div>

    <span
      className={`text-xs font-semibold border px-3 py-1.5 rounded-full whitespace-nowrap ${
        getStockStatusInfo(selectedProduct)
          .badgeClass
      }`}
    >
      {getStockStatusInfo(selectedProduct).label}
    </span>
  </div>

  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-800">
    <div>
      <p className="text-gray-500 text-xs">
        Avisar desde
      </p>

      <p className="text-white text-sm font-medium mt-1">
        {formatQuantityValue(
          selectedProduct.min_stock_yellow,
          selectedProduct
        )}
      </p>
    </div>

    <div>
      <p className="text-gray-500 text-xs">
        Crítico desde
      </p>

      <p className="text-white text-sm font-medium mt-1">
        {formatQuantityValue(
          selectedProduct.min_stock_red,
          selectedProduct
        )}
      </p>
    </div>
  </div>
</div>

       {/* Precio y vencimiento Mobile */}
<div className="grid grid-cols-2 gap-3">
  <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
    <p className="text-gray-500 text-xs">
      Precio de venta
    </p>

    <p className="text-white text-sm font-semibold mt-2">
      {formatProductPrice(selectedProduct)}
    </p>
  </div>

  <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
    <p className="text-gray-500 text-xs">
      Vencimiento
    </p>

    {(() => {
      const expirationInfo =
        getExpirationInfo(selectedProduct)

      return expirationInfo ? (
        <>
          <p className="text-white text-sm font-semibold mt-2">
            {expirationInfo.date}
          </p>

          <p
            className={`text-xs mt-1 ${expirationInfo.textClass}`}
          >
            {expirationInfo.message}
          </p>
        </>
      ) : (
        <p className="text-gray-500 text-xs mt-2">
          Sin vencimiento registrado
        </p>
      )
    })()}
  </div>
</div>

{/* Último movimiento Mobile */}
<div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4">
  <div className="flex items-center justify-between gap-3">
    <p className="text-gray-400 text-sm">
      Último movimiento
    </p>

    {movements.length > 0 && (
      <span className="text-gray-500 text-xs">
        Más reciente
      </span>
    )}
  </div>

  {loadingMovements ? (
    <p className="text-gray-500 text-sm mt-3">
      Cargando...
    </p>
  ) : movements.length === 0 ? (
    <p className="text-gray-500 text-sm mt-3">
      No hay movimientos registrados.
    </p>
  ) : (
    (() => {
      const lastMovement = movements[0]

      return (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {getMovementLabel(lastMovement)}
              </p>

              {getMovementDetail(lastMovement) && (
                <p className="text-gray-500 text-xs mt-1 truncate">
                  {getMovementDetail(lastMovement)}
                </p>
              )}
            </div>

            <p
              className={`text-sm font-semibold shrink-0 ${
                lastMovement.change < 0
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}
            >
              {formatMovementChange(
                lastMovement,
                selectedProduct
              )}
            </p>
          </div>

          <p className="text-gray-500 text-xs mt-2">
            {new Date(
              lastMovement.created_at
            ).toLocaleString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      )
    })()
  )}
</div>

       {/* Acciones Mobile */}
<div className="sticky bottom-0 bg-[#111827] border-t border-gray-800 pt-4 pb-1">
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => {
        setAmount(0)
        setHasAdjustmentAmount(false)
        setAdjustmentMode('entry')
        setAdjustmentReason('')
        setAdjustmentNote('')
        setAdjustmentError('')
        setWeightInputUnit('kg')
        setIsAdjustmentOpen(true)
      }}
      className="bg-blue-600 text-white rounded-xl px-4 py-3.5 text-sm font-semibold active:scale-[0.98] transition"
    >
      Ajustar stock
    </button>

    <button
      type="button"
      onClick={() => {
        setHistoryFilter('all')
        setIsHistoryOpen(true)
      }}
      className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3.5 text-sm font-semibold active:scale-[0.98] transition"
    >
      Ver historial
    </button>
  </div>

  <p className="text-gray-500 text-[11px] text-center mt-3">
    Cada cambio quedará registrado.
  </p>
</div>
      </div>
    </div>
  </div>
)}


</div>
)
}    