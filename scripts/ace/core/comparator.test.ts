import type { CatalogProduct } from '../types'
import { compareCatalogProducts } from './comparator'

function createProduct(
  overrides: Partial<CatalogProduct>
): CatalogProduct {
  return {
    barcode: '7791813434412',
    name: '7UP FREE',
    brand: null,
    category: null,
    image_url: null,
    quantity: '1.5',
    unit: 'litro',
    source: 'eaxa_import',
    country: 'AR',
    confidence: 65,
    verified: false,
    is_global: true,
    times_used: 0,
    search_keywords: [
      '7791813434412',
      '7up free',
      '7up',
      'free',
    ],
    created_by: null,
    ...overrides,
  }
}

function printComparison(
  title: string,
  currentProduct: CatalogProduct,
  incomingProduct: CatalogProduct
): void {
  console.log('')
  console.log('========================================')
  console.log(title)
  console.log('========================================')

  const result = compareCatalogProducts(
    currentProduct,
    incomingProduct
  )

  console.log(`Código: ${result.barcode}`)
  console.log(`Tiene cambios: ${result.hasChanges ? 'Sí' : 'No'}`)
  console.log('')

  result.changes.forEach((change) => {
    console.log(`Campo: ${change.field}`)
    console.log(`Actual: ${change.currentValue ?? '(vacío)'}`)
    console.log(`Entrante: ${change.incomingValue ?? '(vacío)'}`)
    console.log(`Elegido: ${change.selectedValue ?? '(vacío)'}`)
    console.log(`Acción: ${change.action}`)
    console.log(`Motivo: ${change.reason}`)
    console.log('----------------------------------------')
  })

  console.log('')
  console.log('PRODUCTO FINAL')
  console.log(result.mergedProduct)
  console.log('')
}

function runComparatorTests(): void {
  const currentProduct = createProduct({})

  const betterIncomingProduct = createProduct({
    name: '7UP FREE PET 1.5 L',
    brand: '7UP',
    category: 'BEBIDAS',
    image_url: 'https://images.example.com/7up.jpg',
    source: 'openfoodfacts',
    confidence: 85,
    verified: true,
    search_keywords: [
      '7791813434412',
      '7up free pet 1.5 l',
      '7up',
      'bebidas',
    ],
  })

  printComparison(
    'PRUEBA 1: LA FUENTE ENTRANTE ES MEJOR',
    currentProduct,
    betterIncomingProduct
  )

  const worseIncomingProduct = createProduct({
    name: '7UP',
    brand: null,
    category: null,
    image_url: null,
    quantity: null,
    unit: null,
    source: 'external_dataset',
    confidence: 40,
    verified: false,
    search_keywords: ['7791813434412', '7up'],
  })

  printComparison(
    'PRUEBA 2: LA FUENTE ENTRANTE ES PEOR',
    currentProduct,
    worseIncomingProduct
  )

  const equalIncomingProduct = createProduct({
    name: '7up free',
    brand: null,
    category: null,
    image_url: null,
    quantity: '1.5',
    unit: 'litro',
    source: 'manual',
    confidence: 65,
    verified: false,
    search_keywords: [
      '7791813434412',
      '7up free',
    ],
  })

  printComparison(
    'PRUEBA 3: INFORMACIÓN EQUIVALENTE',
    currentProduct,
    equalIncomingProduct
  )
}

runComparatorTests()