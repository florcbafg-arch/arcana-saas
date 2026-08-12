'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as XLSX from "xlsx"
import { useRef } from "react"
import BarcodeScanner from "../components/BarcodeScanner"

const PRODUCT_LIMIT = 2000

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
  barcode?: string
  code?: string
  supplier_id?: string | null
  cost_price?: number
  sale_type?: 'unit' | 'weight'
  unit_base?: string
  price_by?: string
  package_weight_kg?: number | null
  package_cost?: number | null
  expiration_date?: string | null
  suppliers?: {
   name: string
} | null
  brand?: string | null
category?: string | null
image_url?: string | null
quantity?: string | null
times_used?: number
last_used_at?: string | null
country?: string | null
confidence?: number | null
}

type Supplier = {
  id: string
  name: string
}

type OpenFoodSuggestion = {
  code: string
  product_name?: string
  brands?: string
  categories?: string
  image_url?: string
  quantity?: string
}

export default function ProductosPage() {
    const router = useRouter()
  const searchParams = useSearchParams()

  const productToEdit = searchParams.get('edit')

  const [products, setProducts] = useState<Product[]>([])
  const [newProductName, setNewProductName] = useState('')
  const [newMinStock, setNewMinStock] = useState('')
  const [loading, setLoading] = useState(false)
  const [newUnit, setNewUnit] = useState('unidad')
  const [newStock, setNewStock] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newCostPrice, setNewCostPrice] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [newExpirationDate, setNewExpirationDate] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newQuantityLabel, setNewQuantityLabel] = useState('')
  const [openFoodSuggestions, setOpenFoodSuggestions] = useState<OpenFoodSuggestion[]>([])
  const [searchingSuggestions, setSearchingSuggestions] = useState(false)
  const [businessType, setBusinessType] = useState('kiosco')
  const [barcodeWasGenerated, setBarcodeWasGenerated] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const [newActive, setNewActive] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [newBarcode, setNewBarcode] = useState('')
  const [newCode, setNewCode] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [newSupplierId, setNewSupplierId] = useState('')
  const [newSaleType, setNewSaleType] = useState<'unit' | 'weight'>('unit')
  const [newUnitBase, setNewUnitBase] = useState('unidad')
  const [newPriceBy, setNewPriceBy] = useState<'kg' | '100g'>('kg')
  const [newPackageWeightKg, setNewPackageWeightKg] = useState('')
  const [newPackageCost, setNewPackageCost] = useState('')
  const [showMobileTable, setShowMobileTable] = useState(false);
  const [mobileActionProduct, setMobileActionProduct] = useState<Product | null>(null)

  const [mobileProductsView, setMobileProductsView] = useState<
  'home' | 'add' | 'list'
>('home')

const [mobileAddMode, setMobileAddMode] = useState<
  'scan' | 'ean' | 'manual' | null
>(null)

  const [toast, setToast] = useState<{
  type: "success" | "error"
  message: string
} | null>(null)

const openNewProduct = () => {
  resetProductForm()

  setMobileAddMode(null)
  setMobileProductsView('add')
}

const resetProductForm = () => {
  setEditingId(null)

  setNewProductName('')
  setNewUnit('unidad')
  setNewStock('')
  setNewMinStock('')
  setNewPrice('')
  setNewCostPrice('')
  setNewExpirationDate('')

  setNewBrand('')
  setNewCategory('')
  setNewImageUrl('')
  setNewQuantityLabel('')

  setNewBarcode('')
  setNewCode('')
  setBarcodeWasGenerated(false)

  setNewSupplierId('')

  setNewSaleType('unit')
  setNewUnitBase('unidad')
  setNewPriceBy('kg')
  setNewPackageWeightKg('')
  setNewPackageCost('')

  setNewActive(true)

  setOpenFoodSuggestions([])
  setSearchingSuggestions(false)
}

const generateEAN13 = () => {

  const base = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10)
  )

  const sum = base.reduce((acc, num, i) => {
    return acc + num * (i % 2 === 0 ? 1 : 3)
  }, 0)

  const checkDigit = (10 - (sum % 10)) % 10

  const ean = [...base, checkDigit].join('')

  setNewBarcode(ean)
  setBarcodeWasGenerated(true)

  return ean
}

useEffect(() => {
  const loadBusiness = async () => {
    const id = localStorage.getItem('activeBusinessId')

    console.log("ID desde localStorage:", id)

    if (!id) {
      console.log("No hay business activo")
      return
    }

    setSelectedBusinessId(id)

    const { data, error } = await supabase
      .from('businesses')
      .select('business_type')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error cargando tipo de negocio:', error)
      return
    }

    setBusinessType(data?.business_type || 'kiosco')
  }

  loadBusiness()
}, [])

const applyProductData = (product: {
  name?: string | null
  brand?: string | null
  category?: string | null
  image_url?: string | null
  quantity?: string | null
  unit?: string | null
  barcode?: string | null
}) => {
  setNewProductName(product.name || newProductName)
  setNewBrand(product.brand || '')
  setNewCategory(product.category || '')
  setNewImageUrl(product.image_url || '')
  setNewQuantityLabel(product.quantity || '')

  if (product.barcode) {
    setNewBarcode(product.barcode)
  }

  const detectedUnit =
    product.unit || detectUnitFromQuantity(product.quantity || '')

  if (detectedUnit) {
    setNewUnit(detectedUnit)
  }
}

const buildSearchKeywords = (...values: Array<string | null | undefined>) => {
  return Array.from(
    new Set(
      values
        .filter(Boolean)
        .flatMap((value) =>
          String(value)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length >= 3)
        )
    )
  )
}

const saveProductToArcanaCatalog = async (product: {
  barcode?: string | null
  name: string
  brand?: string | null
  category?: string | null
  image_url?: string | null
  quantity?: string | null
  unit?: string | null
  source?: string
}) => {
  const barcode = product.barcode?.trim()

  if (!barcode) return

  try {
    const { data: existingProduct, error: searchError } = await supabase
      .from('arcana_catalog')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle()

    if (searchError) throw searchError

    const now = new Date().toISOString()

    if (existingProduct) {
      const { error: updateError } = await supabase
        .from('arcana_catalog')
        .update({
          name: existingProduct.name || product.name,
          brand: existingProduct.brand || product.brand || null,
          category: existingProduct.category || product.category || null,
          image_url: existingProduct.image_url || product.image_url || null,
          quantity: existingProduct.quantity || product.quantity || null,
          unit: existingProduct.unit || product.unit || null,
          times_used: (existingProduct.times_used || 0) + 1,
          last_used_at: now,
          updated_at: now,
        })
        .eq('id', existingProduct.id)

      if (updateError) throw updateError

      return
    }

    const { error: insertError } = await supabase
      .from('arcana_catalog')
      .insert({
        barcode,
        name: product.name || 'Producto sin nombre',
        brand: product.brand || null,
        category: product.category || null,
        image_url: product.image_url || null,
        quantity: product.quantity || null,
        unit: product.unit || null,
        source: product.source || 'manual',
        country: 'AR',
        confidence: 60,
        search_keywords: buildSearchKeywords(
          product.name,
          product.brand,
          product.category,
          product.quantity,
          barcode
        ),
        times_used: 1,
        last_used_at: now,
      })

    if (insertError) throw insertError
  } catch (error) {
    console.error('ERROR ARCANA CATALOG:', error)
  }
}

const fetchProduct = async (barcodeFromScanner?: string) => {
  const barcode = (barcodeFromScanner || newBarcode).trim()

  if (!barcode) {
    setToast({
      type: "error",
      message: "Primero escaneá o escribí un código de barras"
    })
    return
  }

  try {
    const { data: catalogProduct, error: catalogError } = await supabase
      .from('arcana_catalog')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle()

    if (catalogError) throw catalogError

    if (catalogProduct) {
      applyProductData({
        name: catalogProduct.name,
        brand: catalogProduct.brand,
        category: catalogProduct.category,
        image_url: catalogProduct.image_url,
        quantity: catalogProduct.quantity,
        unit: catalogProduct.unit,
        barcode: catalogProduct.barcode,
      })

      await supabase
        .from('arcana_catalog')
        .update({
          times_used: (catalogProduct.times_used || 0) + 1,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', catalogProduct.id)

      setToast({
        type: "success",
        message: "Producto encontrado en el catálogo inteligente de Arcana."
      })

      return
    }

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,categories,image_url,quantity`
    )

    const data = await res.json()

    if (data.status !== 1) {
      setToast({
        type: "error",
        message: "No encontramos este producto en el catálogo ni en Open Food Facts"
      })
      return
    }

    const product = data.product
    const detectedUnit = detectUnitFromQuantity(product.quantity || '')

    const productToSave = {
      barcode,
      name: product.product_name || 'Producto sin nombre',
      brand: product.brands || null,
      category: product.categories || null,
      image_url: product.image_url || null,
      quantity: product.quantity || null,
      unit: detectedUnit || null,
      source: 'openfood',
      country: 'AR',
      confidence: 70,
      times_used: 1,
      last_used_at: new Date().toISOString(),
    }

    const { error: insertCatalogError } = await supabase
      .from('arcana_catalog')
      .upsert(productToSave, {
        onConflict: 'barcode'
      })

    if (insertCatalogError) throw insertCatalogError

    applyProductData(productToSave)

    setToast({
      type: "success",
      message: "Producto encontrado y guardado en el catálogo inteligente de Arcana."
    })

  } catch (error: any) {
    console.error("ERROR FETCH PRODUCT:", error)

    setToast({
      type: "error",
      message: error.message || "Error buscando producto"
    })
  }
}

const handleProductScan = async (code: string) => {
  setNewBarcode(code)
  setBarcodeWasGenerated(false)
  setShowScanner(false)

  await fetchProduct(code)
}

const searchOpenFoodByName = async () => {
  if (!newProductName.trim()) {
    setToast({
      type: "error",
      message: "Escribí un nombre para buscar sugerencias"
    })
    return
  }

  setSearchingSuggestions(true)

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(newProductName)}&search_simple=1&action=process&json=1&page_size=8&fields=code,product_name,brands,categories,image_url,quantity`
    )

    const data = await res.json()

    setOpenFoodSuggestions(data.products || [])

    if (!data.products || data.products.length === 0) {
      setToast({
        type: "error",
        message: "No encontramos sugerencias para ese producto"
      })
    }
  } catch (error) {
    setToast({
      type: "error",
      message: "Error buscando sugerencias"
    })
  } finally {
    setSearchingSuggestions(false)
  }
}

const useOpenFoodSuggestion = (suggestion: OpenFoodSuggestion) => {
  setNewProductName(suggestion.product_name || newProductName)
  setNewBarcode(suggestion.code || '')
  setNewBrand(suggestion.brands || '')
  setNewCategory(suggestion.categories || '')
  setNewImageUrl(suggestion.image_url || '')
  setNewQuantityLabel(suggestion.quantity || '')

  const detectedUnit = detectUnitFromQuantity(suggestion.quantity || '')

  if (detectedUnit) {
    setNewUnit(detectedUnit)
  }

  setOpenFoodSuggestions([])

  setToast({
    type: "success",
    message: "Arcana completó el producto seleccionado."
  })
}

  const fetchProducts = async () => {
    if (!selectedBusinessId) return

    setLoading(true)

    const { data } = await supabase
      .from('products')
      .select('*, suppliers(name)')
      .eq('business_id', selectedBusinessId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      

    setProducts(data || [])
    setLoading(false)
  }

  const fetchSuppliers = async () => {
  if (!selectedBusinessId) return

  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('business_id', selectedBusinessId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando proveedores:', error)
    return
  }

  setSuppliers(data || [])
}

const parseMoney = (value: string) => {
  return Number(value.replace(/\./g, '').replace(',', '.')) || 0
}

const formatMoneyInput = (value: string) => {
  const onlyNumbers = value.replace(/\D/g, '')

  if (!onlyNumbers) return ''

  return Number(onlyNumbers).toLocaleString('es-AR')
}

const detectUnitFromQuantity = (quantity: string) => {
  const normalized = quantity
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (!normalized) return null

  if (
    normalized.includes('ml') ||
    normalized.includes('cl') ||
    normalized.includes('l') ||
    normalized.includes('litro')
  ) {
    return 'litro'
  }

  if (
    normalized.includes('kg') ||
    normalized.includes('g') ||
    normalized.includes('gr') ||
    normalized.includes('gramo') ||
    normalized.includes('kilo')
  ) {
    return 'kg'
  }

  if (
    normalized.includes('unidad') ||
    normalized.includes('unidades') ||
    normalized.includes('uds') ||
    normalized.includes('pack') ||
    normalized.includes('x')
  ) {
    return 'pack'
  }

  return null
}

const getWeightProductNumbers = () => {
  const packageWeightKg = parseMoney(newPackageWeightKg)
  const packageCost = parseMoney(newPackageCost)
  const salePriceInput = parseMoney(newPrice)

  const salePricePer100g =
    newPriceBy === 'kg' ? salePriceInput / 10 : salePriceInput

  const costPerKg =
    packageWeightKg > 0 ? packageCost / packageWeightKg : 0

  const costPer100g = costPerKg / 10
  const marginPer100g = salePricePer100g - costPer100g

  return {
    salePricePer100g,
    costPer100g,
    marginPer100g,
  }
}

const createProduct = async () => {
  if (!newProductName.trim()) {
    setToast({ type: "error", message: "Ingresá un nombre válido" })
    return
  }

  if (!editingId && products.length >= BASE_LIMIT) {
  setToast({
  type: "error",
  message:
    "Llegaste al límite de 2.000 productos del Plan Base. Actualizá a Arcana Impulso para seguir creciendo."
})
  return
}

  const weightNumbers = getWeightProductNumbers()

  try {

     const barcodeToUse = newBarcode || generateEAN13()
     const autoGenerated = !newBarcode

   if (editingId) {
  const { error } = await supabase
    .from('products')
    .update({
      name: newProductName,
      unit: newUnit,
      stock_quantity: Number(newStock || 0),
      min_stock_yellow: Number(newMinStock || 1),
      min_stock_red: Math.max(1, Math.floor(Number(newMinStock || 1) / 2)),
      expiration_date: newExpirationDate || null,
      price: newSaleType === 'weight'
  ? weightNumbers.salePricePer100g
  : parseMoney(newPrice),
      active: newActive,
      code: newCode || null,
      barcode: barcodeToUse,
      supplier_id: newSupplierId || null,
      cost_price: newSaleType === 'weight'
  ? weightNumbers.costPer100g
  : parseMoney(newCostPrice),
      sale_type: newSaleType,
      unit_base: newSaleType === 'weight' ? 'kg' : 'unit',
      price_by: newSaleType === 'weight' ? newPriceBy : 'unit',
      package_weight_kg: newSaleType === 'weight'
  ? parseMoney(newPackageWeightKg)
  : null,
  package_cost: newSaleType === 'weight'
  ? parseMoney(newPackageCost)
  : null,

  brand: newBrand || null,
category: newCategory || null,
image_url: newImageUrl || null,
quantity: newQuantityLabel || null,
    })
    .eq('id', editingId)

     if (error) throw error

if (autoGenerated) {
  setToast({
    type: "success",
    message: "Producto actualizado. Arcana generó un código de barras automáticamente."
  })
} else {
  setToast({
    type: "success",
    message: "Producto actualizado correctamente"
  })
}

setEditingId(null)

      } else {

      const { error } = await supabase
        .from('products')
    .insert({
  name: newProductName,
  business_id: selectedBusinessId,
  unit: newUnit,
  stock_quantity: Number(newStock || 0),
  min_stock_yellow: Number(newMinStock || 1),
  min_stock_red: Math.max(1, Math.floor(Number(newMinStock || 1) / 2)),
  expiration_date: newExpirationDate || null,
  price: newSaleType === 'weight'
  ? weightNumbers.salePricePer100g
  : parseMoney(newPrice),
  active: newActive,
  code: newCode || null,
  barcode: barcodeToUse,
  supplier_id: newSupplierId || null,
 cost_price: newSaleType === 'weight'
  ? weightNumbers.costPer100g
  : parseMoney(newCostPrice),
  sale_type: newSaleType,
  unit_base: newSaleType === 'weight' ? 'kg' : 'unit',
  price_by: newSaleType === 'weight' ? newPriceBy : 'unit',
  package_weight_kg: newSaleType === 'weight'
  ? parseMoney(newPackageWeightKg)
  : null,
  package_cost: newSaleType === 'weight'
  ? parseMoney(newPackageCost)
  : null,

  brand: newBrand || null,
category: newCategory || null,
image_url: newImageUrl || null,
quantity: newQuantityLabel || null,
})

      if (error) throw error

      setToast({ type: "success", message: "Producto creado correctamente" })
    }

    if (!autoGenerated && !barcodeWasGenerated && barcodeToUse) {
  await saveProductToArcanaCatalog({
    barcode: barcodeToUse,
    name: newProductName,
    brand: newBrand || null,
    category: newCategory || null,
    image_url: newImageUrl || null,
    quantity: newQuantityLabel || null,
    unit: newUnit || null,
    source: newBrand || newCategory || newImageUrl || newQuantityLabel
      ? 'openfood'
      : 'manual',
  })
}

    setNewProductName('')
    setNewUnit('unidad')
    setNewStock('')
    setNewMinStock('')
    setNewPrice('')
    setNewActive(true)
    setIsOpen(false)
    setMobileProductsView('home')
    setMobileAddMode(null)
    setNewCode('')
    setNewBarcode('')
    setNewSupplierId('')
    setNewCostPrice('')
    fetchProducts()
    setNewPackageWeightKg('')
    setNewPackageCost('')
    setNewSaleType('unit')
    setNewUnitBase('unidad')
    setNewPriceBy('kg')
    setNewExpirationDate('')
    setNewBrand('')
    setNewCategory('')
    setNewImageUrl('')
    setNewQuantityLabel('')

  } catch (err: any) {
  console.error("ERROR SUPABASE:", err)

  setToast({
    type: "error",
    message: err.message || "Error al guardar producto"
  })
}
}


 useEffect(() => {
  if (selectedBusinessId) {
    fetchProducts()
    fetchSuppliers()
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
  const product = products.find((p) => p.id === id)

  const confirmed = confirm(
    `¿Eliminar "${product?.name || 'este producto'}"?\n\nSi tiene movimientos registrados, Arcana conservará su historial y lo archivará.`
  )

  if (!confirmed) return

  try {
    // Primero intentamos eliminarlo físicamente
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    // Si se pudo borrar, terminamos
    if (!deleteError) {
      setProducts((currentProducts) =>
        currentProducts.filter((p) => p.id !== id)
      )

      setToast({
        type: 'success',
        message: 'Producto eliminado correctamente.'
      })

      return
    }

    // 23503 = el producto está referenciado por otro registro
    if (deleteError.code === '23503') {
      const { error: archiveError } = await supabase
        .from('products')
        .update({
          active: false
        })
        .eq('id', id)

      if (archiveError) {
        console.error(
          'ERROR ARCHIVANDO PRODUCTO:',
          archiveError
        )

        setToast({
          type: 'error',
          message:
            archiveError.message ||
            'No se pudo archivar el producto.'
        })

        return
      }

      // Lo quitamos inmediatamente de la vista
      setProducts((currentProducts) =>
        currentProducts.filter((p) => p.id !== id)
      )

      setToast({
        type: 'success',
        message:
          'Producto archivado. Arcana conservó su historial de movimientos.'
      })

      return
    }

    // Otro error diferente
    console.error(
      'ERROR ELIMINANDO PRODUCTO:',
      deleteError
    )

    setToast({
      type: 'error',
      message:
        deleteError.message ||
        'No se pudo eliminar el producto.'
    })

  } catch (error: any) {
    console.error(
      'ERROR ELIMINANDO PRODUCTO:',
      error
    )

    setToast({
      type: 'error',
      message:
        error.message ||
        'No se pudo eliminar el producto.'
    })
  }
}
const handleEdit = (product: Product) => {
  setEditingId(product.id)
  setNewProductName(product.name)
  setNewPrice(String(product.price || ''))
  setNewStock(String(product.stock_quantity || ''))
  setNewMinStock(String(product.min_stock_yellow || ''))
  setNewUnit(product.unit)
  setNewActive(product.active)
  setNewCode(product.code || '')
  setNewBarcode(product.barcode || '')
  setNewSupplierId(product.supplier_id || '')
  setNewCostPrice(String(product.cost_price || ''))
  setNewSaleType(product.sale_type || 'unit')
  setNewUnitBase(product.unit_base || 'unidad')
  setIsOpen(true)
  setNewPackageWeightKg(String(product.package_weight_kg || ''))
  setNewExpirationDate(
  product.expiration_date || ''
)
  setNewPackageCost(
  product.package_cost
    ? Number(product.package_cost).toLocaleString('es-AR')
    : ''
)
  setNewPriceBy(
  product.price_by === '100g' ? '100g' : 'kg'
)

setNewBrand(product.brand || '')
setNewCategory(product.category || '')
setNewImageUrl(product.image_url || '')
setNewQuantityLabel(product.quantity || '')
}

useEffect(() => {
  if (!productToEdit) return

  // Esperamos a que los productos hayan cargado
  if (products.length === 0) return

  const product = products.find(
    (p) => p.id === productToEdit
  )

  if (!product) {
    setToast({
      type: 'error',
      message: 'No encontramos el producto solicitado.'
    })

    router.replace(
      '/dashboard/productos',
      { scroll: false }
    )

    return
  }

  // Abre directamente el modal de edición
  handleEdit(product)

  // Limpiamos ?edit= de la URL.
  // Así, al cerrar el modal, no vuelve a abrirse.
  router.replace(
    '/dashboard/productos',
    { scroll: false }
  )

}, [productToEdit, products])

useEffect(() => {
  if (!toast) return

  const timer = setTimeout(() => {
    setToast(null)
  }, 2500)

  return () => clearTimeout(timer)
}, [toast])

const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]

  if (!file) return

  if (!selectedBusinessId) {
    setToast({
      type: "error",
      message: "No hay un negocio activo seleccionado."
    })
    return
  }

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)

    if (rows.length === 0) {
      setToast({
        type: "error",
        message: "El archivo Excel está vacío."
      })
      return
    }

    const requiredFields = ["name", "price", "stock"]

    for (const field of requiredFields) {
      if (!(field in rows[0])) {
        setToast({
          type: "error",
          message: `El Excel debe tener la columna "${field}".`
        })
        return
      }
    }

    const invalidRow = rows.find(
      (row) =>
        !row.name ||
        String(row.name).trim() === "" ||
        row.price === undefined ||
        row.stock === undefined
    )

    if (invalidRow) {
      setToast({
        type: "error",
        message:
          "Hay filas incompletas. Revisá que todos los productos tengan name, price y stock."
      })
      return
    }

    /*
     * Normalizamos los nombres para comparar productos existentes,
     * sin importar mayúsculas, minúsculas o espacios.
     */
    const existingProductNames = new Set(
      products.map((product) =>
        product.name.trim().toLowerCase()
      )
    )

    /*
     * Evitamos contar dos veces un mismo producto nuevo
     * si aparece repetido dentro del propio Excel.
     */
    const newProductNames = new Set<string>()

    for (const row of rows) {
      const productName = String(row.name).trim().toLowerCase()

      if (
        !existingProductNames.has(productName)
      ) {
        newProductNames.add(productName)
      }
    }

    const newProductsCount = newProductNames.size
const projectedTotal = products.length + newProductsCount

if (newProductsCount > 0 && projectedTotal > BASE_LIMIT) {
      const availableSlots = Math.max(
        BASE_LIMIT - products.length,
        0
      )

      setToast({
        type: "error",
        message:
          `No se puede importar el archivo. Contiene ${newProductsCount} productos nuevos, pero solo te quedan ${availableSlots} lugares disponibles en el Plan Base. El límite es de 2.000 productos.`
      })

      /*
       * Permite volver a seleccionar el mismo archivo
       * después de corregirlo.
       */
      e.target.value = ""
      return
    }

    setLoading(true)

    /*
     * Creamos un mapa local para no consultar toda la tabla
     * de productos en cada vuelta del ciclo.
     */
    const productsByName = new Map(
      products.map((product) => [
        product.name.trim().toLowerCase(),
        product
      ])
    )

    for (const row of rows) {
      const generatedCode =
        `PRD-${Date.now()}-${Math.floor(Math.random() * 100000)}`

      const productName = String(row.name)
        .trim()
        .toLowerCase()

      const existing = productsByName.get(productName)

      if (existing) {
        const { error } = await supabase
          .from("products")
          .update({
            stock_quantity:
              Number(existing.stock_quantity || 0) +
              Number(row.stock || 0),

            price:
              row.price !== undefined
                ? Number(row.price)
                : existing.price,

            unit:
              row.unit || existing.unit || "unidad",

            min_stock_yellow:
              row.min_stock_yellow !== undefined
                ? Number(row.min_stock_yellow)
                : existing.min_stock_yellow,

            min_stock_red:
              row.min_stock_yellow !== undefined
                ? Math.max(
                    1,
                    Math.floor(
                      Number(row.min_stock_yellow) / 2
                    )
                  )
                : existing.min_stock_red,

            code:
              row.code || existing.code
          })
          .eq("id", existing.id)

        if (error) throw error
      } else {
        const newProduct = {
          name: String(row.name).trim(),
          price: Number(row.price),
          stock_quantity: Number(row.stock),
          unit: row.unit || "unidad",
          code: row.code || generatedCode,
          min_stock_yellow:
            row.min_stock_yellow !== undefined
              ? Number(row.min_stock_yellow)
              : 1,
          min_stock_red:
            row.min_stock_yellow !== undefined
              ? Math.max(
                  1,
                  Math.floor(
                    Number(row.min_stock_yellow) / 2
                  )
                )
              : 1,
          business_id: selectedBusinessId,
          active: true
        }

        const { data: insertedProduct, error } =
          await supabase
            .from("products")
            .insert(newProduct)
            .select("*")
            .single()

        if (error) throw error

        /*
         * Agregamos el producto recién creado al mapa.
         * Así, si aparece repetido más adelante en el Excel,
         * se actualizará en lugar de volver a insertarse.
         */
        if (insertedProduct) {
          productsByName.set(
            productName,
            insertedProduct
          )
        }
      }
    }

    await fetchProducts()

    setToast({
      type: "success",
      message:
        newProductsCount > 0
          ? `Importación completada. Se agregaron ${newProductsCount} productos nuevos sin superar el límite de 2.000.`
          : "Importación completada. Se actualizaron productos existentes."
    })
  } catch (error: any) {
    console.error("ERROR IMPORTANDO EXCEL:", error)

    setToast({
      type: "error",
      message:
        error.message ||
        "Ocurrió un error al importar los productos."
    })
  } finally {
    setLoading(false)

    /*
     * Limpia el input para permitir importar nuevamente
     * el mismo archivo.
     */
    e.target.value = ""
  }
}

const downloadTemplate = () => {
  const rows = [
    {
      name: "Blazer Negro Clásico",
      price: 89900,
      stock: 5,
      unit: "unidad",
      code: "ARC-001",
      min_stock_yellow: 3,
    },
    {
      name: "Traje Femenino Gris Perla",
      price: 132500,
      stock: 2,
      unit: "unidad",
      code: "ARC-002",
      min_stock_yellow: 2,
    },
    {
      name: "Pantalón Sastrero Nude",
      price: 64500,
      stock: 4,
      unit: "unidad",
      code: "ARC-003",
      min_stock_yellow: 2,
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, "productos")
  XLSX.writeFile(workbook, "plantilla_productos_arcana.xlsx")
}
const BASE_LIMIT = 2000

const isFreeLimitReached =
  !editingId && products.length >= BASE_LIMIT

const remainingProducts =
  Math.max(BASE_LIMIT - products.length, 0)

const usagePercentage =
  Math.min((products.length / BASE_LIMIT) * 100, 100)

  const canGenerateInternalBarcode =
  ['indumentaria', 'bazar', 'libreria', 'otro'].includes(businessType)

  return (
  <div className="p-4 md:p-6 space-y-6 md:space-y-8">


  <input
  type="file"
  accept=".xlsx,.xls"
  ref={fileInputRef}
  onChange={handleExcelUpload}
  style={{ display: "none" }}
/>
   

{toast && (
  <div className="fixed top-5 right-5 z-[9999] max-w-sm">
    <div
      className={`rounded-2xl px-5 py-4 shadow-2xl border text-sm font-medium backdrop-blur-xl
        ${toast.type === "success"
          ? "bg-green-950/95 text-green-300 border-green-700"
          : "bg-red-950/95 text-red-300 border-red-700"
        }`}
    >
      {toast.message}
    </div>
  </div>
)}

{/* ================================================= */}
{/* PRODUCTOS MOBILE — PANTALLA PRINCIPAL */}
{/* ================================================= */}

{mobileProductsView === 'home' && (
  <div className="md:hidden space-y-5">

    <div className="pt-3">
      <h1 className="text-3xl font-semibold text-white">
        📦 Productos
      </h1>

      <p className="text-gray-400 mt-2">
        Gestioná tu catálogo y stock.
      </p>
    </div>


    {/* AGREGAR PRODUCTO */}
    <button
      type="button"
      onClick={openNewProduct}
      className="
        w-full
        rounded-2xl
        border border-[#1F6BFF]/40
        bg-gradient-to-r
        from-[#1F6BFF]/90
        to-[#6C5CE7]/90
        p-5
        text-left
        shadow-lg
        shadow-blue-500/10
      "
    >
      <div className="flex items-center gap-4">

        <div className="
          w-12 h-12
          shrink-0
          rounded-2xl
          bg-white/10
          flex items-center justify-center
          text-2xl
        ">
          ➕
        </div>

        <div className="flex-1">
          <p className="text-white text-lg font-semibold">
            Agregar producto
          </p>

          <p className="text-blue-100/70 text-sm mt-1">
            Escaneá un código o cargalo manualmente.
          </p>
        </div>

        <span className="text-white text-xl">
          ›
        </span>

      </div>
    </button>


    {/* MIS PRODUCTOS */}
    <button
      type="button"
      onClick={() => setShowMobileTable(true)}
      className="
        w-full
        rounded-2xl
        border border-[#2A2A32]
        bg-[#14141A]
        p-5
        text-left
      "
    >
      <div className="flex items-center gap-4">

        <div className="
          w-12 h-12
          shrink-0
          rounded-2xl
          bg-[#1A1A22]
          flex items-center justify-center
          text-2xl
        ">
          📁
        </div>

        <div className="flex-1">

          <p className="text-white text-lg font-semibold">
            Mis productos
          </p>

          <p className="text-gray-400 text-sm mt-1">
            {products.length} productos en tu catálogo
          </p>

          <p className="text-[#6EA8FF] text-sm mt-2">
            Buscar, editar o eliminar
          </p>

        </div>

        <span className="text-gray-400 text-xl">
          ›
        </span>

      </div>
    </button>


    {/* IMPORTAR PRODUCTOS */}
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="
        w-full
        rounded-2xl
        border border-[#6C5CE7]/30
        bg-[#6C5CE7]/10
        p-5
        text-left
      "
    >
      <div className="flex items-center gap-4">

        <div className="
          w-12 h-12
          shrink-0
          rounded-2xl
          bg-[#6C5CE7]/20
          flex items-center justify-center
          text-2xl
        ">
          📥
        </div>

        <div className="flex-1">

          <p className="text-white text-lg font-semibold">
            Importar productos
          </p>

          <p className="text-gray-400 text-sm mt-1">
            Agregá varios productos desde un archivo.
          </p>

        </div>

        <span className="text-gray-400 text-xl">
          ›
        </span>

      </div>
    </button>

{/* CONTADOR DEL PLAN */}
<div
  className="
    w-full
    rounded-2xl
    border border-[#25252D]
    bg-[#101018]
    px-5 py-4
  "
>
  <div className="flex items-center justify-between gap-3">

    <div>
      <p className="text-sm font-semibold text-white">
        Plan Base
      </p>

      <p className="text-sm text-gray-400 mt-1">
        {products.length} de {PRODUCT_LIMIT} productos
      </p>
    </div>

    <div
      className="
        rounded-xl
        border border-[#1F6BFF]/30
        bg-[#1F6BFF]/10
        px-3 py-2
        text-[#6EA8FF]
        text-sm
        font-medium
      "
    >
      {Math.max(PRODUCT_LIMIT - products.length, 0)} disponibles
    </div>

  </div>
</div>

  </div>
)}


{/* ================================================= */}
{/* PRODUCTOS MOBILE — ELEGIR MÉTODO DE ALTA */}
{/* ================================================= */}

{mobileProductsView === 'add' && (
  <div className="md:hidden space-y-5">

    {/* VOLVER */}
    <button
      type="button"
      onClick={() => setMobileProductsView('home')}
      className="
        flex
        items-center
        gap-2
        text-gray-300
        text-sm
        pt-2
      "
    >
      ← Volver a Productos
    </button>


    <div className="text-center pt-4 pb-2">

      <div className="
        mx-auto
        w-16 h-16
        rounded-2xl
        bg-[#6C5CE7]/15
        flex items-center justify-center
        text-3xl
        mb-4
      ">
        📦
      </div>

      <h2 className="text-2xl font-semibold text-white">
        ¿Cómo querés agregar el producto?
      </h2>

      <p className="text-gray-400 text-sm mt-2">
        Elegí la opción que te resulte más cómoda.
      </p>

    </div>


    {/* ESCANEAR */}
    <button
      type="button"
      onClick={() => {
  resetProductForm()
  setMobileAddMode('scan')
  setIsOpen(true)
  setShowScanner(true)
}}
      className="
        w-full
        rounded-2xl
        border border-[#6C5CE7]/40
        bg-[#6C5CE7]/10
        p-5
        text-left
      "
    >
      <div className="flex items-center gap-4">

        <div className="
          w-14 h-14
          shrink-0
          rounded-2xl
          bg-[#6C5CE7]/25
          flex items-center justify-center
          text-2xl
        ">
          📷
        </div>

        <div className="flex-1">

          <p className="text-white text-lg font-semibold">
            Escanear código
          </p>

          <p className="text-gray-400 text-sm mt-1">
            Usá la cámara para escanear el código de barras.
          </p>

        </div>

        <span className="text-[#A99BFF] text-xl">
          ›
        </span>

      </div>
    </button>


    {/* INGRESAR EAN */}
    <button
      type="button"
     onClick={() => {
  resetProductForm()
  setMobileAddMode('ean')
  setIsOpen(true)
}}
      className="
        w-full
        rounded-2xl
        border border-[#1F6BFF]/40
        bg-[#1F6BFF]/10
        p-5
        text-left
      "
    >
      <div className="flex items-center gap-4">

        <div className="
          w-14 h-14
          shrink-0
          rounded-2xl
          bg-[#1F6BFF]/20
          flex items-center justify-center
          text-2xl
        ">
          ▥
        </div>

        <div className="flex-1">

          <p className="text-white text-lg font-semibold">
            Ingresar código EAN
          </p>

          <p className="text-gray-400 text-sm mt-1">
            Escribí el código de barras del producto.
          </p>

        </div>

        <span className="text-[#6EA8FF] text-xl">
          ›
        </span>

      </div>
    </button>


    {/* MANUAL */}
    <button
      type="button"
    onClick={() => {
  resetProductForm()
  setMobileAddMode('manual')
  setIsOpen(true)
}}
      className="
        w-full
        rounded-2xl
        border border-[#2A2A32]
        bg-[#14141A]
        p-5
        text-left
      "
    >
      <div className="flex items-center gap-4">

        <div className="
          w-14 h-14
          shrink-0
          rounded-2xl
          bg-[#1A1A22]
          flex items-center justify-center
          text-2xl
        ">
          ✏️
        </div>

        <div className="flex-1">

          <p className="text-white text-lg font-semibold">
            Cargar manualmente
          </p>

          <p className="text-gray-400 text-sm mt-1">
            Completá vos mismo los datos del producto.
          </p>

        </div>

        <span className="text-gray-400 text-xl">
          ›
        </span>

      </div>
    </button>


    {/* AYUDA */}
    <div className="
      rounded-2xl
      border border-[#25252D]
      bg-[#101018]
      p-4
      flex gap-3
    ">

      <span className="text-xl">
        💡
      </span>

      <div>

        <p className="text-white text-sm font-medium">
          Arcana puede ayudarte
        </p>

        <p className="text-gray-500 text-xs mt-1 leading-5">
          Si escaneás o ingresás un código EAN,
          Arcana buscará automáticamente la información disponible del producto.
        </p>

      </div>

    </div>

  </div>
)}

{/* HEADER */}
<div className="hidden md:flex md:flex-row md:justify-between md:items-center gap-4">

  <div>
    <h1 className="text-2xl font-semibold text-white">
      📦 Productos
    </h1>
    <p className="text-gray-400 mt-1">
      Gestioná tu catálogo y stock.
    </p>
  </div>

  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

    <button
      onClick={() => fileInputRef.current?.click()}
     className="w-full sm:w-auto bg-[#6C5CE7] hover:bg-[#5A4BD1] transition rounded-xl px-5 py-3 font-semibold"
      
    >
      📥 Importar
    </button>

    <button
      onClick={() => setIsOpen(true)}
      className="w-full sm:w-auto bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-5 py-3 font-semibold"
    >
      ➕ Nuevo producto
    </button>

  </div>

</div>   {/* ← ACA SE CIERRA EL HEADER */}

{/* BUSCADOR */}
<div className="hidden md:block mt-4 mb-4">

{/* PLAN FREE */}
<div className="bg-[#14141A] border border-[#1F1F24] rounded-2xl p-4 mb-4">
  <div className="flex items-center justify-between mb-3">
    <div>
      <p className="text-white font-semibold">
        Plan Base
      </p>

      <p className="text-sm text-gray-400">
        {products.length} / {BASE_LIMIT} productos usados
      </p>
    </div>

    <span className="text-xs px-3 py-1 rounded-full bg-[#1F6BFF]/20 text-[#6EA8FF] border border-[#1F6BFF]/30">
      BASE
    </span>
  </div>

  <div className="w-full h-2 rounded-full bg-[#0F0F14] overflow-hidden">
    <div
      className={`h-full transition-all duration-500 ${
        usagePercentage > 85
          ? 'bg-red-500'
          : usagePercentage > 70
          ? 'bg-yellow-400'
          : 'bg-[#1F6BFF]'
      }`}
      style={{
        width: `${usagePercentage}%`
      }}
    />
  </div>

  <p className="text-xs text-gray-500 mt-3">
    {remainingProducts > 0
      ? `Te quedan ${remainingProducts} productos disponibles.`
      : 'Llegaste al límite del Plan Base.'}
  </p>

  {usagePercentage >= 70 && (
    <p className="text-xs text-[#6EA8FF] mt-1">
      Arcana Impulso aumenta la capacidad de tu negocio.
    </p>
  )}
</div>

  <input
    type="text"
    placeholder="Buscar producto..."
    className="bg-[#0B0B10] border border-[#2A2A32] rounded-xl px-4 py-3 text-white w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40"
  onChange={(e) => setSearchTerm(e.target.value)}
  />

</div>


    {/* TABLA */}
    <div className="hidden md:block bg-[#14141A] border border-[#1F1F24] rounded-2xl overflow-hidden">
  <div className="overflow-x-auto">
    <div className="max-h-[500px] overflow-y-auto min-w-[720px]">
      <table className="w-full text-sm">

        <thead className="bg-[#0F0F14] text-gray-400">
  <tr className="text-left">
    <th className="p-4">Producto</th>
    <th className="p-4">Precio</th>
    <th className="p-4">Costo</th>
    <th className="p-4">Margen</th>
    <th className="p-4">Proveedor</th>
    <th className="p-4">Stock</th>
    <th className="p-4">Estado</th>
    <th className="p-4">Código</th>
    <th className="p-4 text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>

          {products.filter((p) =>
  p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (p.barcode && p.barcode.includes(searchTerm)) ||
  (p.code && p.code.includes(searchTerm))
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

<td className="p-4 text-gray-300">
  ${Number(p.cost_price || 0).toLocaleString()}
</td>

<td className="p-4 font-semibold text-green-400">
  ${Number((p.price || 0) - (p.cost_price || 0)).toLocaleString()}
</td>

<td className="p-4 text-gray-400">
  {p.suppliers?.name || '—'}
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

<td className="p-4 text-gray-400 text-xs">
 {p.code || p.barcode || "—"}
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
</div>

     {products.length === 0 && (
  <div className="p-6 md:p-8">
    <div className="bg-[#101018] border border-[#1F1F24] rounded-2xl p-6 md:p-8">
      <h3 className="text-white text-lg md:text-xl font-semibold mb-2">
        Empezá cargando tus productos
      </h3>

      <p className="text-gray-400 text-sm md:text-base mb-6 max-w-2xl">
        Podés cargarlos uno por uno desde el botón <span className="text-white font-medium">Nuevo producto</span> o importar varios juntos usando un archivo Excel.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0B0B10] border border-[#1F1F24] rounded-xl p-5">
          <h4 className="text-white font-semibold mb-2">Carga manual</h4>
          <p className="text-gray-400 text-sm mb-4">
            Ideal si recién empezás o si tenés pocos productos.
          </p>

          <button
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-5 py-3 font-semibold"
          >
            ➕ Nuevo producto
          </button>
        </div>

        <div className="bg-[#0B0B10] border border-[#1F1F24] rounded-xl p-5">
          <h4 className="text-white font-semibold mb-2">Importar desde Excel</h4>
          <p className="text-gray-400 text-sm mb-4">
            Usá la plantilla básica de Arcana para importar tus productos sin errores.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadTemplate}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition rounded-xl px-5 py-3 font-semibold text-white shadow-lg shadow-purple-500/20"
            >
              ⬇ Descargar plantilla
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto bg-[#6C5CE7] hover:bg-[#5A4BD1] transition rounded-xl px-5 py-3 font-semibold"
            >
              📥 Importar Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0B0B10] border border-dashed border-[#2A2A32] rounded-xl p-5 md:p-6">
  <div className="mb-4">
    <p className="text-sm md:text-base text-gray-200 font-semibold">
      Cómo debe estar armado tu Excel
    </p>
    <p className="text-xs md:text-sm text-gray-400 mt-1">
      Arcana puede importar productos desde una planilla simple. Para empezar, no necesitás completar todo.
    </p>
  </div>

  <div className="mb-5">
    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
      Columnas obligatorias
    </p>

    <div className="flex flex-wrap gap-2 mb-3">
      <span
        title="Nombre del producto"
        className="px-3 py-1 rounded-full bg-[#1A1A22] text-white text-xs border border-[#2A2A32]"
      >
        name
      </span>

      <span
        title="Precio de venta"
        className="px-3 py-1 rounded-full bg-[#1A1A22] text-white text-xs border border-[#2A2A32]"
      >
        price
      </span>

      <span
        title="Stock inicial"
        className="px-3 py-1 rounded-full bg-[#1A1A22] text-white text-xs border border-[#2A2A32]"
      >
        stock
      </span>
    </div>

    <p className="text-xs text-gray-500">
      Con estas 3 columnas ya podés importar tus productos.
    </p>
  </div>

  <div className="mb-5">
    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
      Columnas opcionales
    </p>

    <div className="flex flex-wrap gap-2 mb-3">
      <span
        title="Unidad de venta, por ejemplo: unidad, kg, litro o pack"
        className="px-3 py-1 rounded-full bg-[#121826] text-blue-300 text-xs border border-[#24304A]"
      >
        unit
      </span>

      <span
        title="Código interno del producto, por ejemplo: VEL-202"
        className="px-3 py-1 rounded-full bg-[#1A1426] text-purple-300 text-xs border border-[#34264A]"
      >
        code
      </span>

      <span
        title="Stock mínimo para que Arcana te avise cuando el producto esté bajo"
        className="px-3 py-1 rounded-full bg-[#20180F] text-yellow-300 text-xs border border-[#4A3A22]"
      >
        min_stock_yellow
      </span>
    </div>

    <p className="text-xs text-gray-500">
      Si no completás estas columnas, Arcana igual puede importar tu archivo.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
    <div className="bg-[#101522] border border-[#1D2740] rounded-xl p-4">
      <p className="text-sm text-white font-medium mb-1">Qué hace cada campo</p>
      <ul className="space-y-1 text-xs text-gray-400">
        <li><span className="text-white">name:</span> nombre del producto</li>
        <li><span className="text-white">price:</span> precio de venta</li>
        <li><span className="text-white">stock:</span> cantidad inicial</li>
        <li><span className="text-white">unit:</span> unidad de venta</li>
        <li><span className="text-white">code:</span> código interno del producto</li>
        <li><span className="text-white">min_stock_yellow:</span> alerta de stock mínimo</li>
      </ul>
    </div>

    <div className="bg-[#0F1A14] border border-[#1F3A2A] rounded-xl p-4">
      <p className="text-sm text-white font-medium mb-1">Consejo para empezar</p>
      <p className="text-xs text-gray-300 leading-5">
        Si recién empezás, usá solo <span className="text-white font-medium">name</span>,{" "}
        <span className="text-white font-medium">price</span> y{" "}
        <span className="text-white font-medium">stock</span>.
        Después podés completar el resto desde Arcana o en una próxima importación.
      </p>
    </div>
  </div>

  <p className="text-xs text-gray-500">
    Importante: una fila por producto y sin cambiar los nombres de las columnas.
  </p>
</div>
    </div>
  </div>
)}

    </div>

{/* ================================================= */}
{/* PRODUCTOS MOBILE — NUEVO PRODUCTO */}
{/* ================================================= */}

{isOpen && !editingId && (
  <div className="md:hidden fixed inset-0 z-[900] bg-[#08080D] flex flex-col">

    {/* HEADER */}
    <div className="
      shrink-0
      flex
      items-center
      gap-3
      px-5
      py-4
      border-b
      border-[#25252D]
      bg-[#0B0B10]
    ">

      <button
        type="button"
        onClick={() => {
          setIsOpen(false)
          setMobileProductsView('add')
        }}
        className="
          w-10 h-10
          shrink-0
          rounded-xl
          border border-[#25252D]
          bg-[#14141A]
          text-gray-300
          flex items-center justify-center
        "
      >
        ←
      </button>

      <div>
        <h2 className="text-lg font-semibold text-white">
          Nuevo producto
        </h2>

        <p className="text-xs text-gray-500 mt-0.5">
          Completá los datos necesarios para cargarlo.
        </p>
      </div>

    </div>


    {/* CONTENIDO */}
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">


      {/* ============================================== */}
      {/* EAN — PRIMER PASO */}
      {/* ============================================== */}

      {mobileAddMode === 'ean' && (
        <div className="
          rounded-2xl
          border border-[#1F6BFF]/30
          bg-[#101522]
          p-4
        ">

          <div className="mb-3">
            <p className="text-white font-semibold">
              Código de barras
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Escribí el EAN y Arcana buscará la información del producto.
            </p>
          </div>

          <div className="flex gap-2">

            <input
              value={newBarcode}
              inputMode="numeric"
              onChange={(e) => {
                setNewBarcode(e.target.value)
                setBarcodeWasGenerated(false)
              }}
              placeholder="Ej: 7793046008008"
              className="
                flex-1
                min-w-0
                bg-[#0B0B10]
                border border-[#2A2A32]
                rounded-xl
                px-4 py-3
                text-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#1F6BFF]/40
              "
            />

            <button
              type="button"
              onClick={() => fetchProduct()}
              className="
                shrink-0
                bg-green-700
                hover:bg-green-600
                rounded-xl
                px-4
                text-white
                font-semibold
              "
            >
              Buscar
            </button>

          </div>

        </div>
      )}


      {/* ============================================== */}
      {/* PRODUCTO ENCONTRADO */}
      {/* ============================================== */}

      {(newImageUrl ||
        newBrand ||
        newQuantityLabel ||
        (mobileAddMode !== 'manual' && newProductName)) && (

        <div className="
          rounded-2xl
          border border-green-500/30
          bg-green-500/10
          overflow-hidden
        ">

          <div className="px-4 pt-4">
            <p className="text-green-400 text-sm font-semibold">
              ✓ Arcana encontró el producto
            </p>
          </div>

          <div className="flex gap-4 p-4">

            <div className="
              w-20 h-20
              shrink-0
              rounded-xl
              overflow-hidden
              bg-[#101018]
              border border-[#25252D]
              flex items-center justify-center
            ">

              {newImageUrl ? (
                <img
                  src={newImageUrl}
                  alt={newProductName || 'Producto'}
                  className="w-full h-full object-contain bg-white p-1"
                />
              ) : (
                <span className="text-3xl">
                  📦
                </span>
              )}

            </div>


            <div className="min-w-0 flex-1">

              {newProductName && (
                <p className="text-white font-semibold">
                  {newProductName}
                </p>
              )}

              {newBrand && (
                <p className="text-sm text-gray-400 mt-1">
                  Marca: {newBrand}
                </p>
              )}

              {newQuantityLabel && (
                <p className="text-sm text-gray-400">
                  Presentación: {newQuantityLabel}
                </p>
              )}

              {newBarcode && (
                <p className="text-xs text-gray-500 mt-1">
                  EAN: {newBarcode}
                </p>
              )}

            </div>

          </div>

        </div>

      )}


      {/* ============================================== */}
      {/* INFORMACIÓN PRINCIPAL */}
      {/* ============================================== */}

      <div className="space-y-4">

        <p className="text-xs uppercase tracking-wide text-gray-500">
          Información del producto
        </p>


        {/* NOMBRE */}
        <div className="space-y-1">

          <label className="text-sm text-gray-400">
            Nombre del producto
          </label>

          <input
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="Ej: Coca Cola 500cc"
            className="
              w-full
              bg-[#0B0B10]
              border border-[#2A2A32]
              rounded-xl
              px-4 py-3
              text-white
              focus:outline-none
              focus:ring-2
              focus:ring-[#1F6BFF]/40
            "
          />

        </div>


        {/* INFO ENCONTRADA */}
        {(newBrand || newQuantityLabel || newCategory) && (

          <div className="
            rounded-xl
            bg-[#101018]
            border border-[#25252D]
            p-4
            space-y-3
          ">

            {newBrand && (
              <div>
                <p className="text-[11px] uppercase text-gray-600">
                  Marca
                </p>

                <p className="text-sm text-gray-200 mt-1">
                  {newBrand}
                </p>
              </div>
            )}

            {newQuantityLabel && (
              <div>
                <p className="text-[11px] uppercase text-gray-600">
                  Presentación
                </p>

                <p className="text-sm text-gray-200 mt-1">
                  {newQuantityLabel}
                </p>
              </div>
            )}

            {newCategory && (
              <div>
                <p className="text-[11px] uppercase text-gray-600">
                  Categoría
                </p>

                <p className="text-sm text-gray-200 mt-1">
                  {newCategory}
                </p>
              </div>
            )}

          </div>

        )}


        {/* EAN EN MANUAL */}
        {mobileAddMode === 'manual' && (

          <div className="space-y-1">

            <label className="text-sm text-gray-400">
              Código de barras (opcional)
            </label>

            <input
              value={newBarcode}
              inputMode="numeric"
              onChange={(e) => {
                setNewBarcode(e.target.value)
                setBarcodeWasGenerated(false)
              }}
              placeholder="Si no tiene, Arcana puede generar uno"
              className="
                w-full
                bg-[#0B0B10]
                border border-[#2A2A32]
                rounded-xl
                px-4 py-3
                text-white
              "
            />

          </div>

        )}

      </div>


      {/* ============================================== */}
      {/* TIPO DE VENTA */}
      {/* ============================================== */}

      <div className="space-y-3">

        <p className="text-xs uppercase tracking-wide text-gray-500">
          Tipo de venta
        </p>


        <label
          className={`
            block
            rounded-2xl
            border
            p-4
            ${
              newSaleType === 'unit'
                ? 'bg-[#122039] border-[#1F6BFF]/60'
                : 'bg-[#101018] border-[#25252D]'
            }
          `}
        >

          <div className="flex items-start gap-3">

            <input
              type="radio"
              checked={newSaleType === 'unit'}
              onChange={() => {
                setNewSaleType('unit')
                setNewUnitBase('unidad')
              }}
              className="mt-1"
            />

            <div>
              <p className="text-white font-medium">
                Unidad / paquete
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Bebidas, galletas, yerba, productos envasados.
              </p>
            </div>

          </div>

        </label>


        <label
          className={`
            block
            rounded-2xl
            border
            p-4
            ${
              newSaleType === 'weight'
                ? 'bg-[#122039] border-[#1F6BFF]/60'
                : 'bg-[#101018] border-[#25252D]'
            }
          `}
        >

          <div className="flex items-start gap-3">

            <input
              type="radio"
              checked={newSaleType === 'weight'}
              onChange={() => {
                setNewSaleType('weight')
                setNewUnitBase('kg')
                setNewUnit('kg')
                setNewPriceBy('kg')
              }}
              className="mt-1"
            />

            <div>
              <p className="text-white font-medium">
                Peso fraccionado
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Quesos, fiambres, frutos secos, caramelos.
              </p>
            </div>

          </div>

        </label>

      </div>


      {/* ============================================== */}
      {/* PRECIO POR PESO */}
      {/* ============================================== */}

      {newSaleType === 'weight' && (

        <div className="space-y-3">

          <p className="text-sm text-gray-400">
            Precio cargado por
          </p>

          <div className="grid grid-cols-2 gap-3">

            <label className={`
              rounded-xl
              border
              p-3
              text-center
              ${
                newPriceBy === 'kg'
                  ? 'bg-[#122039] border-[#1F6BFF]/60'
                  : 'bg-[#101018] border-[#25252D]'
              }
            `}>

              <input
                type="radio"
                checked={newPriceBy === 'kg'}
                onChange={() => setNewPriceBy('kg')}
                className="mr-2"
              />

              <span className="text-white text-sm">
                Kilo
              </span>

            </label>


            <label className={`
              rounded-xl
              border
              p-3
              text-center
              ${
                newPriceBy === '100g'
                  ? 'bg-[#122039] border-[#1F6BFF]/60'
                  : 'bg-[#101018] border-[#25252D]'
              }
            `}>

              <input
                type="radio"
                checked={newPriceBy === '100g'}
                onChange={() => setNewPriceBy('100g')}
                className="mr-2"
              />

              <span className="text-white text-sm">
                100 gramos
              </span>

            </label>

          </div>

        </div>

      )}


      {/* ============================================== */}
      {/* VENTA */}
      {/* ============================================== */}

      <div className="space-y-4">

        <p className="text-xs uppercase tracking-wide text-gray-500">
          Venta
        </p>


        <div className="space-y-1">

          <label className="text-sm text-gray-400">
            Unidad de venta
          </label>

          <select
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="
              w-full
              bg-[#0B0B10]
              border border-[#2A2A32]
              rounded-xl
              px-4 py-3
              text-white
            "
          >
            <option value="unidad">Unidad</option>
            <option value="kg">Kilo</option>
            <option value="litro">Litro</option>
            <option value="pack">Pack</option>
          </select>

        </div>


        <div className="space-y-1">

          <label className="text-sm text-gray-400">
            {newSaleType === 'weight'
              ? `Precio de venta por ${
                  newPriceBy === '100g'
                    ? '100g'
                    : 'kg'
                }`
              : 'Precio de venta'}
          </label>

          <div className="relative">

            <span className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-gray-400
            ">
              $
            </span>

            <input
              value={newPrice}
              inputMode="numeric"
              onChange={(e) =>
                setNewPrice(formatMoneyInput(e.target.value))
              }
              placeholder="Ej: 1.500"
              className="
                w-full
                bg-[#0B0B10]
                border border-[#2A2A32]
                rounded-xl
                py-3
                pl-9 pr-4
                text-white
              "
            />

          </div>

        </div>

      </div>


      {/* ============================================== */}
      {/* STOCK */}
      {/* ============================================== */}

      <div className="space-y-4">

        <p className="text-xs uppercase tracking-wide text-gray-500">
          Stock
        </p>


        <div className="grid grid-cols-2 gap-3">

          <div className="space-y-1">

            <label className="text-sm text-gray-400">
              {newSaleType === 'weight'
                ? 'Stock inicial (kg)'
                : 'Stock inicial'}
            </label>

            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="Ej: 24"
              className="
                w-full
                bg-[#0B0B10]
                border border-[#2A2A32]
                rounded-xl
                px-4 py-3
                text-white
              "
            />

          </div>


          <div className="space-y-1">

            <label className="text-sm text-gray-400">
              Stock mínimo
            </label>

            <input
              type="number"
              min={1}
              value={newMinStock}
              onChange={(e) => setNewMinStock(e.target.value)}
              placeholder="Ej: 5"
              className="
                w-full
                bg-[#0B0B10]
                border border-[#2A2A32]
                rounded-xl
                px-4 py-3
                text-white
              "
            />

          </div>

        </div>

      </div>


      {/* ============================================== */}
      {/* DATOS OPCIONALES */}
      {/* ============================================== */}

      <div className="space-y-4">

        <p className="text-xs uppercase tracking-wide text-gray-500">
          Opcional
        </p>


        <div className="space-y-1">

          <label className="text-sm text-gray-400">
            Fecha de vencimiento
          </label>

          <input
            type="date"
            value={newExpirationDate}
            onChange={(e) =>
              setNewExpirationDate(e.target.value)
            }
            className="
              w-full
              bg-[#0B0B10]
              border border-[#2A2A32]
              rounded-xl
              px-4 py-3
              text-white
            "
          />

          <p className="text-xs text-gray-500">
            Arcana te avisará antes de que venza.
          </p>

        </div>


        <div className="space-y-1">

          <label className="text-sm text-gray-400">
            Código interno
          </label>

          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Ej: VEL-202"
            className="
              w-full
              bg-[#0B0B10]
              border border-[#2A2A32]
              rounded-xl
              px-4 py-3
              text-white
            "
          />

        </div>

      </div>


      {/* ============================================== */}
      {/* ACTIVO */}
      {/* ============================================== */}

      <label className="
        flex
        items-center
        justify-between
        gap-4
        bg-[#101018]
        border border-[#25252D]
        rounded-2xl
        p-4
      ">

        <div>

          <p className="text-white font-medium">
            Producto activo
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Estará disponible para vender dentro de Arcana.
          </p>

        </div>

        <input
          type="checkbox"
          checked={newActive}
          onChange={(e) => setNewActive(e.target.checked)}
        />

      </label>


      <div className="h-4" />

    </div>


    {/* FOOTER */}
    <div className="
      shrink-0
      border-t
      border-[#25252D]
      bg-[#111116]
      px-5 py-4
    ">

      <button
        type="button"
        onClick={createProduct}
        disabled={isFreeLimitReached}
        className="
          w-full
          bg-[#1F6BFF]
          disabled:opacity-50
          rounded-2xl
          py-4
          text-white
          font-semibold
          text-base
        "
      >
        Guardar producto
      </button>

    </div>

  </div>
)}

{isOpen && (
 <div className="hidden md:flex fixed inset-0 bg-black/70 backdrop-blur-sm items-center justify-center z-50 p-3 md:p-6">

    <div
      className="
        bg-[#14141A]
        border border-[#25252D]
        rounded-2xl
        w-full
        max-w-5xl
        max-h-[92vh]
        flex
        flex-col
        overflow-hidden
        shadow-2xl
        shadow-black/50
      "
    >

      {/* HEADER DEL MODAL */}
      <div className="px-5 py-4 md:px-7 md:py-5 border-b border-[#25252D] flex items-center justify-between">

        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            {editingId ? 'Editar producto' : 'Nuevo producto'}
          </h2>

          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Completá los datos para administrar tu producto en Arcana.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="
            w-9 h-9
            rounded-xl
            flex items-center justify-center
            text-gray-400
            hover:text-white
            hover:bg-[#1F1F27]
            transition
          "
        >
          ✕
        </button>

      </div>


      {/* CONTENIDO SCROLLEABLE */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        <div className="p-5 md:p-7">

          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8">


            {/* ================================================= */}
            {/* COLUMNA IZQUIERDA — IMAGEN DEL PRODUCTO */}
            {/* ================================================= */}

            <div className="lg:sticky lg:top-0 self-start">

              <div
                className="
                  bg-[#0B0B10]
                  border border-[#25252D]
                  rounded-2xl
                  p-4
                  md:p-5
                "
              >

                <div className="mb-4">

                  <p className="text-sm font-semibold text-white">
                    Imagen del producto
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Te ayuda a identificarlo rápidamente.
                  </p>

                </div>


                {/* IMAGEN */}
                <div
                  className="
                    w-full
                    aspect-square
                    rounded-2xl
                    bg-[#101018]
                    border border-[#25252D]
                    overflow-hidden
                    flex items-center justify-center
                  "
                >

                  {newImageUrl ? (

                    <img
                      src={newImageUrl}
                      alt={newProductName || 'Producto'}
                      className="w-full h-full object-contain p-4 bg-white"
                    />

                  ) : (

                    <div className="flex flex-col items-center justify-center text-center p-6">

                      <div
                        className="
                          w-16 h-16
                          rounded-2xl
                          bg-[#1A1A22]
                          flex items-center justify-center
                          text-3xl
                          mb-4
                        "
                      >
                        📦
                      </div>

                      <p className="text-sm text-white font-medium">
                        Sin imagen
                      </p>

                      <p className="text-xs text-gray-500 mt-1 leading-5">
                        Si Arcana encuentra una foto del producto, aparecerá acá.
                      </p>

                    </div>

                  )}

                </div>


                {/* ESTADO DE LA FOTO */}
                <div className="mt-4">

                  {newImageUrl ? (

                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-3">

                      <p className="text-xs font-semibold text-green-400">
                        ✓ Imagen encontrada
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Arcana completó automáticamente la imagen del producto.
                      </p>

                    </div>

                  ) : (

                    <div className="rounded-xl bg-[#12121A] border border-[#25252D] px-3 py-3">

                      <p className="text-xs text-gray-400">
                        Más adelante vas a poder agregar o cambiar esta imagen manualmente.
                      </p>

                    </div>

                  )}

                </div>


                {/* INFO VISUAL DEL PRODUCTO */}
                {(newBrand || newQuantityLabel) && (

                  <div className="mt-4 pt-4 border-t border-[#25252D] space-y-2">

                    {newBrand && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-600">
                          Marca
                        </p>

                        <p className="text-sm text-gray-200 mt-0.5">
                          {newBrand}
                        </p>
                      </div>
                    )}

                    {newQuantityLabel && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-600">
                          Presentación
                        </p>

                        <p className="text-sm text-gray-200 mt-0.5">
                          {newQuantityLabel}
                        </p>
                      </div>
                    )}

                  </div>

                )}

              </div>

            </div>


            {/* ================================================= */}
            {/* COLUMNA DERECHA — FORMULARIO */}
            {/* ================================================= */}

            <div className="space-y-5">


              {/* NOMBRE */}
              <div className="space-y-1">

                <label className="text-sm text-gray-400">
                  Nombre del producto
                </label>

                <input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Ej: Coca Cola 500cc"
                  className="
                    w-full
                    bg-[#0B0B10]
                    border border-[#2A2A32]
                    rounded-xl
                    p-3
                    text-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#1F6BFF]/40
                    transition
                  "
                />

                <button
                  type="button"
                  onClick={searchOpenFoodByName}
                  disabled={searchingSuggestions}
                  className="
                    mt-2
                    w-full
                    bg-[#2A2A32]
                    hover:bg-[#333]
                    transition
                    rounded-xl
                    px-4 py-2.5
                    text-sm
                    text-white
                    disabled:opacity-50
                  "
                >
                  {searchingSuggestions
                    ? 'Buscando sugerencias...'
                    : '🔎 Buscar por nombre'}
                </button>


                {/* SUGERENCIAS */}
                {openFoodSuggestions.length > 0 && (

                  <div className="mt-3 rounded-2xl border border-[#2A2A32] bg-[#0B0B10] overflow-hidden">

                    <div className="p-3 border-b border-[#2A2A32]">

                      <p className="text-sm font-semibold text-white">
                        Sugerencias encontradas
                      </p>

                      <p className="text-xs text-gray-500">
                        Tocá una opción para completar el producto.
                      </p>

                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-[#1F1F24]">

                      {openFoodSuggestions.map((suggestion) => (

                        <button
                          key={suggestion.code}
                          type="button"
                          onClick={() => useOpenFoodSuggestion(suggestion)}
                          className="w-full flex gap-3 p-3 text-left hover:bg-[#14141A] transition"
                        >

                          {suggestion.image_url ? (

                            <img
                              src={suggestion.image_url}
                              alt={suggestion.product_name || 'Producto'}
                              className="w-14 h-14 rounded-lg object-contain bg-white p-1"
                            />

                          ) : (

                            <div className="w-14 h-14 rounded-lg bg-[#1A1A22] flex items-center justify-center text-gray-500">
                              📦
                            </div>

                          )}

                          <div className="flex-1 min-w-0">

                            <p className="text-sm text-white font-semibold truncate">
                              {suggestion.product_name || 'Producto sin nombre'}
                            </p>

                            {suggestion.brands && (
                              <p className="text-xs text-gray-400 truncate">
                                Marca: {suggestion.brands}
                              </p>
                            )}

                            {suggestion.quantity && (
                              <p className="text-xs text-gray-400">
                                Presentación: {suggestion.quantity}
                              </p>
                            )}

                            {suggestion.code && (
                              <p className="text-xs text-gray-600">
                                Código: {suggestion.code}
                              </p>
                            )}

                          </div>

                          <span className="text-xs text-[#6EA8FF] font-semibold">
                            Usar
                          </span>

                        </button>

                      ))}

                    </div>

                  </div>

                )}

                <p className="text-xs text-gray-500">
                  Ej: Coca Cola 500cc, Yerba 1kg, Papas fritas
                </p>

              </div>


              {/* CÓDIGO DE BARRAS */}
              <div className="space-y-1">

                <label className="text-sm text-gray-400">
                  Código de barras (opcional)
                </label>

                <div className="flex gap-2">

                  <input
                    value={newBarcode}
                    onChange={(e) => {
                      setNewBarcode(e.target.value)
                      setBarcodeWasGenerated(false)
                    }}
                    placeholder="Ej: 7791234567890"
                    className="
                      flex-1
                      min-w-0
                      bg-[#0B0B10]
                      border border-[#2A2A32]
                      rounded-xl
                      p-3
                      text-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#1F6BFF]/40
                      transition
                    "
                  />

                  {canGenerateInternalBarcode && (

                    <button
                      type="button"
                      onClick={generateEAN13}
                      className="px-3 bg-[#2A2A32] rounded-xl hover:bg-[#333]"
                    >
                      ⚡
                    </button>

                  )}

                  <button
                    type="button"
                    onClick={() => fetchProduct()}
                    className="
                      px-4
                      bg-green-700
                      rounded-xl
                      hover:bg-green-600
                      text-white
                      text-sm
                      font-medium
                    "
                  >
                    🔎 Buscar
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="
                      px-3
                      bg-[#6C5CE7]
                      rounded-xl
                      hover:bg-[#5A4BD1]
                      text-white
                    "
                  >
                    📷
                  </button>

                </div>

              </div>


              {/* ARCANA ENCONTRÓ DATOS */}
              {(newImageUrl ||
                newBrand ||
                newCategory ||
                newQuantityLabel) && (

                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">

                  <div className="flex items-start gap-3">

                    <div
                      className="
                        w-8 h-8
                        shrink-0
                        rounded-lg
                        bg-green-500/15
                        flex items-center justify-center
                        text-green-400
                      "
                    >
                      ✓
                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-green-400">
                        Arcana encontró el producto
                      </p>

                      {newProductName && (
                        <p className="text-white font-semibold mt-2">
                          {newProductName}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">

                        {newBrand && (
                          <span>
                            Marca:{' '}
                            <span className="text-gray-200">
                              {newBrand}
                            </span>
                          </span>
                        )}

                        {newQuantityLabel && (
                          <span>
                            Presentación:{' '}
                            <span className="text-gray-200">
                              {newQuantityLabel}
                            </span>
                          </span>
                        )}

                      </div>

                      {newCategory && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          Categoría: {newCategory}
                        </p>
                      )}

                    </div>

                  </div>

                </div>

              )}


              {/* TIPO DE VENTA */}
              <div className="space-y-2">

                <label className="text-sm text-gray-400">
                  Tipo de venta
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  <label
                    className={`
                      flex items-start gap-3
                      border
                      rounded-xl
                      p-4
                      cursor-pointer
                      transition
                      ${
                        newSaleType === 'unit'
                          ? 'bg-[#122039] border-[#1F6BFF]/60'
                          : 'bg-[#0B0B10] border-[#2A2A32]'
                      }
                    `}
                  >

                    <input
                      type="radio"
                      checked={newSaleType === 'unit'}
                      onChange={() => {
                        setNewSaleType('unit')
                        setNewUnitBase('unidad')
                      }}
                      className="mt-1"
                    />

                    <div>

                      <p className="text-sm text-white font-medium">
                        Unidad / paquete
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Coca Cola 500cc, Galletas 600g, Yerba 1kg
                      </p>

                    </div>

                  </label>


                  <label
                    className={`
                      flex items-start gap-3
                      border
                      rounded-xl
                      p-4
                      cursor-pointer
                      transition
                      ${
                        newSaleType === 'weight'
                          ? 'bg-[#122039] border-[#1F6BFF]/60'
                          : 'bg-[#0B0B10] border-[#2A2A32]'
                      }
                    `}
                  >

                    <input
                      type="radio"
                      checked={newSaleType === 'weight'}
                      onChange={() => {
                        setNewSaleType('weight')
                        setNewUnitBase('kg')
                        setNewUnit('kg')
                        setNewPriceBy('kg')
                      }}
                      className="mt-1"
                    />

                    <div>

                      <p className="text-sm text-white font-medium">
                        Peso fraccionado
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Queso, Papas fritas, Caramelos, Frutos secos
                      </p>

                    </div>

                  </label>

                </div>

              </div>


              {/* PRECIO POR PESO */}
              {newSaleType === 'weight' && (

                <div className="space-y-2">

                  <label className="text-sm text-gray-400">
                    Precio cargado por
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    <label
                      className={`
                        flex items-center gap-2
                        border
                        rounded-xl
                        p-3
                        cursor-pointer
                        ${
                          newPriceBy === 'kg'
                            ? 'bg-[#122039] border-[#1F6BFF]/60'
                            : 'bg-[#0B0B10] border-[#2A2A32]'
                        }
                      `}
                    >

                      <input
                        type="radio"
                        checked={newPriceBy === 'kg'}
                        onChange={() => setNewPriceBy('kg')}
                      />

                      <span className="text-sm text-white">
                        Kilo
                      </span>

                    </label>

                    <label
                      className={`
                        flex items-center gap-2
                        border
                        rounded-xl
                        p-3
                        cursor-pointer
                        ${
                          newPriceBy === '100g'
                            ? 'bg-[#122039] border-[#1F6BFF]/60'
                            : 'bg-[#0B0B10] border-[#2A2A32]'
                        }
                      `}
                    >

                      <input
                        type="radio"
                        checked={newPriceBy === '100g'}
                        onChange={() => setNewPriceBy('100g')}
                      />

                      <span className="text-sm text-white">
                        100 gramos
                      </span>

                    </label>

                  </div>

                  <p className="text-xs text-gray-500">
                    Ej: si el queso vale $1.300 cada 100g, elegí “100 gramos”.
                  </p>

                </div>

              )}


              {/* COMPRA PRODUCTO POR PESO */}
              {newSaleType === 'weight' && (

                <div className="bg-[#0B0B10] border border-[#2A2A32] rounded-2xl p-4 space-y-4">

                  <div>

                    <p className="text-sm text-white font-semibold">
                      Compra del producto
                    </p>

                    <p className="text-xs text-gray-500">
                      Arcana usa estos datos para calcular el costo real y el margen.
                    </p>

                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="space-y-1">

                      <label className="text-sm text-gray-400">
                        Peso del paquete comprado
                      </label>

                      <input
                        type="text"
                        value={newPackageWeightKg}
                        onChange={(e) =>
                          setNewPackageWeightKg(e.target.value)
                        }
                        placeholder="Ej: 5"
                        className="
                          w-full
                          bg-[#101018]
                          border border-[#2A2A32]
                          rounded-xl
                          p-3
                          text-white
                        "
                      />

                      <p className="text-xs text-gray-500">
                        Ej: si compraste una horma de 5kg, escribí 5.
                      </p>

                    </div>


                    <div className="space-y-1">

                      <label className="text-sm text-gray-400">
                        Costo total del paquete
                      </label>

                      <div className="relative">

                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          $
                        </span>

                        <input
                          type="text"
                          value={newPackageCost}
                          onChange={(e) =>
                            setNewPackageCost(
                              formatMoneyInput(e.target.value)
                            )
                          }
                          placeholder="Ej: 12.000"
                          className="
                            w-full
                            bg-[#101018]
                            border border-[#2A2A32]
                            rounded-xl
                            p-3 pl-8
                            text-white
                          "
                        />

                      </div>

                      <p className="text-xs text-gray-500">
                        Es lo que pagaste por el paquete completo.
                      </p>

                    </div>

                  </div>

                </div>

              )}


              {/* UNIDAD Y PRECIO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-1">

                  <label className="text-sm text-gray-400">
                    Unidad de venta
                  </label>

                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="
                      w-full
                      bg-[#0B0B10]
                      border border-[#2A2A32]
                      rounded-xl
                      p-3
                      text-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#1F6BFF]/40
                      transition
                    "
                  >

                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilo</option>
                    <option value="litro">Litro</option>
                    <option value="pack">Pack</option>

                  </select>

                </div>


                <div className="space-y-1">

                  <label className="text-sm text-gray-400">
                    {newSaleType === 'weight'
                      ? `Precio de venta por ${
                          newPriceBy === '100g'
                            ? '100g'
                            : 'kg'
                        }`
                      : 'Precio de venta'}
                  </label>

                  <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>

                    <input
                      type="text"
                      placeholder="Ej: 15000"
                      value={newPrice}
                      onChange={(e) =>
                        setNewPrice(
                          formatMoneyInput(e.target.value)
                        )
                      }
                      className="
                        w-full
                        bg-[#0B0B10]
                        border border-[#2A2A32]
                        rounded-xl
                        p-3 pl-8
                        text-white
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#1F6BFF]/40
                        transition
                      "
                    />

                  </div>

                </div>

              </div>


              {/* PROVEEDOR Y COSTO */}
              <div
                className={`grid grid-cols-1 ${
                  newSaleType !== 'weight'
                    ? 'md:grid-cols-2'
                    : ''
                } gap-4`}
              >

                <div className="space-y-1">

                  <label className="text-sm text-gray-400">
                    Proveedor
                  </label>

                  <select
                    value={newSupplierId}
                    onChange={(e) =>
                      setNewSupplierId(e.target.value)
                    }
                    className="
                      w-full
                      bg-[#0B0B10]
                      border border-[#2A2A32]
                      rounded-xl
                      p-3
                      text-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#1F6BFF]/40
                    "
                  >

                    <option value="">
                      Sin proveedor
                    </option>

                    {suppliers.map((supplier) => (

                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>

                    ))}

                  </select>

                </div>


                {newSaleType !== 'weight' && (

                  <div className="space-y-1">

                    <label className="text-sm text-gray-400">
                      Costo de compra
                    </label>

                    <div className="relative">

                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        $
                      </span>

                      <input
                        type="text"
                        placeholder="Ej: 9000"
                        value={newCostPrice}
                        onChange={(e) =>
                          setNewCostPrice(
                            formatMoneyInput(e.target.value)
                          )
                        }
                        className="
                          w-full
                          bg-[#0B0B10]
                          border border-[#2A2A32]
                          rounded-xl
                          p-3 pl-8
                          text-white
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[#1F6BFF]/40
                        "
                      />

                    </div>

                  </div>

                )}

              </div>


              {/* MARGEN */}
              {newSaleType === 'weight' ? (

                (() => {

                  const numbers = getWeightProductNumbers()

                  return (

                    <div
                      className={`
                        rounded-xl
                        border
                        px-4 py-3
                        text-sm
                        font-semibold
                        ${
                          numbers.marginPer100g >= 0
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }
                      `}
                    >
                      Margen estimado por 100g: $
                      {numbers.marginPer100g.toLocaleString(
                        'es-AR'
                      )}
                    </div>

                  )

                })()

              ) : (

                parseMoney(newPrice) > 0 &&
                parseMoney(newCostPrice) > 0 && (

                  <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm font-semibold text-green-400">

                    Margen estimado: $
                    {(
                      parseMoney(newPrice) -
                      parseMoney(newCostPrice)
                    ).toLocaleString('es-AR')}

                  </div>

                )

              )}


              {/* STOCK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-1">

                  <label className="text-sm text-gray-400">
                    {newSaleType === 'weight'
                      ? 'Stock inicial (kg disponibles)'
                      : 'Stock inicial (unidades)'}
                  </label>

                  <input
                    type="number"
                    placeholder={
                      newSaleType === 'weight'
                        ? 'Ej: 5'
                        : 'Ej: 24'
                    }
                    value={newStock}
                    onChange={(e) =>
                      setNewStock(e.target.value)
                    }
                    className="
                      w-full
                      bg-[#0B0B10]
                      border border-[#2A2A32]
                      rounded-xl
                      p-3
                      text-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#1F6BFF]/40
                    "
                  />

                </div>


                <div className="space-y-1">

                  <label className="text-sm text-gray-400">
                    {newSaleType === 'weight'
                      ? 'Stock mínimo (kg para alerta)'
                      : 'Stock mínimo (unidades para alerta)'}
                  </label>

                  <input
                    type="number"
                    min={1}
                    placeholder={
                      newSaleType === 'weight'
                        ? 'Ej: 2'
                        : 'Ej: 5'
                    }
                    value={newMinStock}
                    onChange={(e) =>
                      setNewMinStock(e.target.value)
                    }
                    className="
                      w-full
                      bg-[#0B0B10]
                      border border-[#2A2A32]
                      rounded-xl
                      p-3
                      text-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#1F6BFF]/40
                    "
                  />

                </div>

              </div>


              {/* VENCIMIENTO Y CÓDIGO INTERNO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-1">

                  <label className="text-sm text-gray-400">
                    Fecha de vencimiento (opcional)
                  </label>

                  <input
                    type="date"
                    value={newExpirationDate}
                    onChange={(e) =>
                      setNewExpirationDate(e.target.value)
                    }
                    className="
                      w-full
                      bg-[#0B0B10]
                      border border-[#2A2A32]
                      rounded-xl
                      p-3
                      text-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#1F6BFF]/40
                    "
                  />

                  <p className="text-xs text-gray-500">
                    Arcana te avisará antes de que el producto venza.
                  </p>

                </div>


                <div className="space-y-1">

                  <label className="text-sm text-gray-400">
                    Código del producto (opcional)
                  </label>

                  <input
                    value={newCode}
                    onChange={(e) =>
                      setNewCode(e.target.value)
                    }
                    placeholder="Ej: VEL-202"
                    className="
                      w-full
                      bg-[#0B0B10]
                      border border-[#2A2A32]
                      rounded-xl
                      p-3
                      text-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#1F6BFF]/40
                    "
                  />

                </div>

              </div>


              {/* ACTIVO */}
              <label
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  bg-[#0B0B10]
                  border border-[#2A2A32]
                  rounded-xl
                  p-4
                  cursor-pointer
                "
              >

                <div>

                  <p className="text-sm text-white font-medium">
                    Producto activo
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    El producto estará disponible para usar dentro de Arcana.
                  </p>

                </div>

                <input
                  type="checkbox"
                  checked={newActive}
                  onChange={(e) =>
                    setNewActive(e.target.checked)
                  }
                />

              </label>

            </div>

          </div>

        </div>

      </div>


      {/* FOOTER FIJO */}
      <div
        className="
          px-5 py-4
          md:px-7
          border-t border-[#25252D]
          bg-[#111116]
          flex
          flex-col-reverse
          sm:flex-row
          justify-end
          gap-3
        "
      >

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="
            w-full
            sm:w-auto
            px-5 py-2.5
            rounded-xl
            border border-[#2A2A32]
            bg-[#1A1A22]
            text-white
            hover:bg-[#22222B]
            hover:border-[#3A3A48]
            transition
          "
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={createProduct}
          className="
            w-full
            sm:w-auto
            bg-[#1F6BFF]
            hover:bg-[#2E7BFF]
            transition
            px-6 py-2.5
            rounded-xl
            font-semibold
            text-white
          "
        >
          {editingId
            ? 'Guardar cambios'
            : 'Guardar producto'}
        </button>

      </div>

    </div>

  </div>
)}

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

    {/* HEADER */}
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
          📷 Escanear código
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


    {/* CÁMARA */}
    <div className="flex-1 min-h-0 p-4 md:p-6">

      <div className="h-full w-full max-w-3xl mx-auto">

        <BarcodeScanner
          onScan={async (code) => {
            await handleProductScan(code)

            // Cerramos la cámara después de una lectura
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
        Arcana buscará el producto automáticamente después de detectar el código.
      </p>
    </div>

  </div>
)}

{showMobileTable && (
  <div className="fixed inset-0 z-[999] bg-[#08080D] flex flex-col">

    <div className="flex items-center justify-between p-4 border-b border-[#1F1F24]">
      <div>
        <h2 className="text-lg font-bold text-white">
          Tabla compacta
        </h2>

        <p className="text-xs text-gray-400">
          Vista rápida mobile
        </p>
      </div>

      <button
        onClick={() => setShowMobileTable(false)}
        className="text-white text-2xl"
      >
        ✕
      </button>
    </div>

    <div className="flex-1 overflow-auto p-3">

      <table className="w-full text-sm">
        <thead className="text-gray-400 border-b border-[#1F1F24]">
          <tr>
            <th className="text-left py-3">Producto</th>
            <th className="text-center py-3">Stock</th>
            <th className="text-right py-3">Precio</th>
            <th className="text-right py-3">Margen</th>
            <th className="text-right py-3"></th>
          </tr>
        </thead>

        <tbody>
          {products
            .filter((p) =>
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (p.barcode && p.barcode.includes(searchTerm)) ||
              (p.code && p.code.includes(searchTerm))
            )
            .map((p) => {

              const hasCost = Number(p.cost_price || 0) > 0

const margin = hasCost
  ? Number(p.price || 0) - Number(p.cost_price || 0)
  : null

              return (
                <tr
                  key={p.id}
                  className="border-b border-[#1A1A22]"
                >
                  <td className="py-3 text-white">
                    {p.name}
                  </td>

                  <td className="py-3 text-center text-white">
                    {p.stock_quantity}
                  </td>

                  <td className="py-3 text-right text-[#1F6BFF] font-semibold">
                    ${Number(p.price).toLocaleString()}
                  </td>

                  <td className="py-3 text-right text-green-400 font-semibold">
  {margin !== null
    ? `$${margin.toLocaleString()}`
    : "—"}
</td>

<td className="py-3 text-right">
  <button
   onClick={() => setMobileActionProduct(p)}
    className="text-gray-400 hover:text-white text-2xl px-2"
  >
    ⋮
  </button>
</td>

                </tr>
              )
            })}
        </tbody>
      </table>

    </div>
  </div>
)}

{mobileActionProduct && (
  <div className="fixed inset-0 z-[1000] bg-black/60 flex items-end">
    <div className="w-full bg-[#14141A] border-t border-[#2A2A32] rounded-t-3xl p-5 space-y-4">

      <div>
        <p className="text-white font-semibold text-lg">
          {mobileActionProduct.name}
        </p>
        <p className="text-sm text-gray-400">
          Elegí una acción
        </p>
      </div>

      <button
        onClick={() => {
          handleEdit(mobileActionProduct)
          setMobileActionProduct(null)
          setShowMobileTable(false)
        }}
        className="w-full bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl py-3 font-semibold text-white"
      >
        ✏️ Editar producto
      </button>

      <button
        onClick={() => {
          handleDelete(mobileActionProduct.id)
          setMobileActionProduct(null)
        }}
        className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl py-3 font-semibold"
      >
        🗑 Eliminar producto
      </button>

      <button
        onClick={() => setMobileActionProduct(null)}
        className="w-full bg-[#1A1A22] border border-[#2A2A32] text-white rounded-xl py-3 font-semibold"
      >
        Cancelar
      </button>

    </div>
  </div>
)}

  </div>

)
}
