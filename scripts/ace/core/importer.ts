import type {
  CatalogProduct,
  ImportStats,
} from '../types'

import {
  classifyBarcode,
  validateCatalogProduct,
} from './validator'

export type InvalidCatalogProduct = {
  rowNumber: number
  barcode: string
  name: string
  reason: string
}

export type DuplicateCatalogProduct = {
  barcode: string
  name: string
  rowNumber: number
  originalRowNumber: number
}

export type BarcodeStats = {
  ean13: number
  numericCode: number
  invalid: number
}

export type PreparedImport = {
  products: CatalogProduct[]
  invalidProducts: InvalidCatalogProduct[]
  duplicateProducts: DuplicateCatalogProduct[]
  stats: ImportStats
  barcodeStats: BarcodeStats
}

/**
 * Prepara los productos antes de enviarlos a Supabase.
 *
 * Este proceso:
 * 1. Valida cada producto.
 * 2. Clasifica los códigos.
 * 3. Detecta duplicados dentro del mismo archivo.
 * 4. Conserva una sola versión por código.
 * 5. Genera estadísticas.
 *
 * Todavía NO modifica la base de datos.
 */
export function prepareCatalogImport(
  products: CatalogProduct[]
): PreparedImport {
  const validProducts: CatalogProduct[] = []
  const invalidProducts: InvalidCatalogProduct[] = []
  const duplicateProducts: DuplicateCatalogProduct[] = []

  const barcodeStats: BarcodeStats = {
    ean13: 0,
    numericCode: 0,
    invalid: 0,
  }

  /*
   * Guardamos el producto elegido para cada código
   * junto con su número de fila original.
   */
  const productsByBarcode = new Map<
    string,
    {
      product: CatalogProduct
      rowNumber: number
    }
  >()

  products.forEach((product, index) => {
    /*
     * Sumamos 2 porque:
     * - index comienza en 0;
     * - la primera fila del Excel es el encabezado.
     */
    const rowNumber = index + 2

    const validation = validateCatalogProduct(product)
    const barcodeType = classifyBarcode(product.barcode)

    if (barcodeType === 'ean13') {
      barcodeStats.ean13 += 1
    } else if (barcodeType === 'numeric_code') {
      barcodeStats.numericCode += 1
    } else {
      barcodeStats.invalid += 1
    }

    if (!validation.valid) {
      invalidProducts.push({
        rowNumber,
        barcode: product.barcode,
        name: product.name,
        reason:
          validation.reason ??
          'Producto inválido sin motivo especificado',
      })

      return
    }

    const existingEntry = productsByBarcode.get(
      product.barcode
    )

    if (!existingEntry) {
      productsByBarcode.set(product.barcode, {
        product,
        rowNumber,
      })

      return
    }

    /*
     * Si el código aparece repetido, elegimos
     * la versión que tenga más información útil.
     */
    const selectedProduct = chooseBestProduct(
      existingEntry.product,
      product
    )

    const selectedIsNewProduct =
      selectedProduct === product

    if (selectedIsNewProduct) {
      duplicateProducts.push({
        barcode: existingEntry.product.barcode,
        name: existingEntry.product.name,
        rowNumber: existingEntry.rowNumber,
        originalRowNumber: rowNumber,
      })

      productsByBarcode.set(product.barcode, {
        product,
        rowNumber,
      })
    } else {
      duplicateProducts.push({
        barcode: product.barcode,
        name: product.name,
        rowNumber,
        originalRowNumber: existingEntry.rowNumber,
      })
    }
  })

  for (const entry of productsByBarcode.values()) {
    validProducts.push(entry.product)
  }

  const stats: ImportStats = {
    total: products.length,
    inserted: 0,
    updated: 0,
    duplicated: duplicateProducts.length,
    invalid: invalidProducts.length,
    failed: 0,
  }

  return {
    products: validProducts,
    invalidProducts,
    duplicateProducts,
    stats,
    barcodeStats,
  }
}

/**
 * Decide cuál de dos productos duplicados
 * contiene la información más completa.
 */
function chooseBestProduct(
  currentProduct: CatalogProduct,
  candidateProduct: CatalogProduct
): CatalogProduct {
  const currentScore = calculateProductScore(
    currentProduct
  )

  const candidateScore = calculateProductScore(
    candidateProduct
  )

  if (candidateScore > currentScore) {
    return candidateProduct
  }

  return currentProduct
}

/**
 * Asigna puntos según la información disponible.
 *
 * Así evitamos conservar una fila incompleta
 * cuando el mismo código aparece nuevamente
 * con marca, cantidad o unidad.
 */
function calculateProductScore(
  product: CatalogProduct
): number {
  let score = 0

  if (product.barcode) score += 10
  if (product.name) score += 10
  if (product.brand) score += 4
  if (product.category) score += 3
  if (product.image_url) score += 3
  if (product.quantity) score += 2
  if (product.unit) score += 2

  score += product.confidence / 100

  return score
}