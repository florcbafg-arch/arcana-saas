import type { CatalogProduct } from '../types'
import { classifyBarcode } from './validator'

export type RankedValue = {
  value: string
  count: number
}

export type MissingFieldStats = {
  brand: number
  category: number
  image: number
  quantity: number
  unit: number
}

export type MissingFieldPercentages = {
  brand: number
  category: number
  image: number
  quantity: number
  unit: number
}

export type DatasetInspection = {
  totalProducts: number
  uniqueProducts: number

  ean13Count: number
  numericCodeCount: number
  invalidCodeCount: number

  uniqueBrands: number
  uniqueCategories: number
  uniqueUnits: number

  missingFields: MissingFieldStats
  missingPercentages: MissingFieldPercentages

  topBrands: RankedValue[]
  topCategories: RankedValue[]
  topUnits: RankedValue[]

  averageConfidence: number
  healthScore: number
  healthLabel: string
  observations: string[]
}

/**
 * Analiza la calidad general de un conjunto de productos
 * antes de enviarlo al catálogo global de Arcana.
 */
export function inspectCatalogDataset(
  products: CatalogProduct[]
): DatasetInspection {
  const barcodes = new Set<string>()
  const brands = new Map<string, number>()
  const categories = new Map<string, number>()
  const units = new Map<string, number>()

  const missingFields: MissingFieldStats = {
    brand: 0,
    category: 0,
    image: 0,
    quantity: 0,
    unit: 0,
  }

  let ean13Count = 0
  let numericCodeCount = 0
  let invalidCodeCount = 0
  let confidenceTotal = 0

  for (const product of products) {
    if (product.barcode) {
      barcodes.add(product.barcode)
    }

    const barcodeType = classifyBarcode(product.barcode)

    if (barcodeType === 'ean13') {
      ean13Count += 1
    } else if (barcodeType === 'numeric_code') {
      numericCodeCount += 1
    } else {
      invalidCodeCount += 1
    }

    confidenceTotal += product.confidence

    if (product.brand) {
      addToRanking(brands, product.brand)
    } else {
      missingFields.brand += 1
    }

    if (product.category) {
      addToRanking(categories, product.category)
    } else {
      missingFields.category += 1
    }

    if (product.image_url) {
      // El producto ya tiene imagen.
    } else {
      missingFields.image += 1
    }

    if (!product.quantity) {
      missingFields.quantity += 1
    }

    if (product.unit) {
      addToRanking(units, product.unit)
    } else {
      missingFields.unit += 1
    }
  }

  const totalProducts = products.length

  const missingPercentages: MissingFieldPercentages = {
    brand: calculatePercentage(
      missingFields.brand,
      totalProducts
    ),
    category: calculatePercentage(
      missingFields.category,
      totalProducts
    ),
    image: calculatePercentage(
      missingFields.image,
      totalProducts
    ),
    quantity: calculatePercentage(
      missingFields.quantity,
      totalProducts
    ),
    unit: calculatePercentage(
      missingFields.unit,
      totalProducts
    ),
  }

  const averageConfidence =
    totalProducts > 0
      ? roundNumber(confidenceTotal / totalProducts)
      : 0

  const healthScore = calculateHealthScore({
    totalProducts,
    ean13Count,
    invalidCodeCount,
    missingPercentages,
  })

  return {
    totalProducts,
    uniqueProducts: barcodes.size,

    ean13Count,
    numericCodeCount,
    invalidCodeCount,

    uniqueBrands: brands.size,
    uniqueCategories: categories.size,
    uniqueUnits: units.size,

    missingFields,
    missingPercentages,

    topBrands: getTopValues(brands, 15),
    topCategories: getTopValues(categories, 15),
    topUnits: getTopValues(units, 10),

    averageConfidence,
    healthScore,
    healthLabel: getHealthLabel(healthScore),
    observations: buildObservations({
      totalProducts,
      ean13Count,
      numericCodeCount,
      invalidCodeCount,
      missingPercentages,
    }),
  }
}

function addToRanking(
  ranking: Map<string, number>,
  rawValue: string
): void {
  const value = rawValue.trim()

  if (!value) return

  ranking.set(
    value,
    (ranking.get(value) ?? 0) + 1
  )
}

function getTopValues(
  ranking: Map<string, number>,
  limit: number
): RankedValue[] {
  return Array.from(ranking.entries())
    .map(([value, count]) => ({
      value,
      count,
    }))
    .sort((first, second) => {
      if (second.count !== first.count) {
        return second.count - first.count
      }

      return first.value.localeCompare(second.value)
    })
    .slice(0, limit)
}

function calculatePercentage(
  amount: number,
  total: number
): number {
  if (total === 0) return 0

  return roundNumber((amount / total) * 100)
}

function roundNumber(value: number): number {
  return Math.round(value * 100) / 100
}

function calculateHealthScore(input: {
  totalProducts: number
  ean13Count: number
  invalidCodeCount: number
  missingPercentages: MissingFieldPercentages
}): number {
  const {
    totalProducts,
    ean13Count,
    invalidCodeCount,
    missingPercentages,
  } = input

  if (totalProducts === 0) {
    return 0
  }

  const eanCoverage =
    (ean13Count / totalProducts) * 100

  const invalidPenalty =
    (invalidCodeCount / totalProducts) * 100

  /*
   * Distribución del puntaje:
   *
   * 40 puntos: cobertura de EAN-13
   * 20 puntos: códigos válidos
   * 15 puntos: presencia de marca
   * 10 puntos: presencia de cantidad
   * 10 puntos: presencia de unidad
   *  5 puntos: presencia de categoría
   *
   * Las imágenes no penalizan todavía porque
   * Open Food Facts podrá agregarlas después.
   */
  let score = 0

  score += (eanCoverage / 100) * 40
  score += Math.max(0, 20 - invalidPenalty)

  score +=
    ((100 - missingPercentages.brand) / 100) *
    15

  score +=
    ((100 - missingPercentages.quantity) / 100) *
    10

  score +=
    ((100 - missingPercentages.unit) / 100) *
    10

  score +=
    ((100 - missingPercentages.category) / 100) *
    5

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  )
}

function getHealthLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 75) return 'Muy bueno'
  if (score >= 60) return 'Aceptable'
  if (score >= 40) return 'Necesita mejoras'

  return 'Calidad baja'
}

function buildObservations(input: {
  totalProducts: number
  ean13Count: number
  numericCodeCount: number
  invalidCodeCount: number
  missingPercentages: MissingFieldPercentages
}): string[] {
  const {
    totalProducts,
    ean13Count,
    numericCodeCount,
    invalidCodeCount,
    missingPercentages,
  } = input

  const observations: string[] = []

  if (totalProducts === 0) {
    return ['El dataset no contiene productos analizables.']
  }

  const eanPercentage = calculatePercentage(
    ean13Count,
    totalProducts
  )

  if (eanPercentage >= 75) {
    observations.push(
      `Excelente cobertura EAN-13: ${eanPercentage}%.`
    )
  } else if (eanPercentage >= 50) {
    observations.push(
      `Cobertura EAN-13 aceptable: ${eanPercentage}%.`
    )
  } else {
    observations.push(
      `La cobertura EAN-13 es baja: ${eanPercentage}%.`
    )
  }

  if (numericCodeCount > 0) {
    observations.push(
      `${numericCodeCount} productos utilizan códigos numéricos que no son EAN-13 válidos.`
    )
  }

  if (invalidCodeCount === 0) {
    observations.push(
      'No se detectaron códigos estructuralmente inválidos.'
    )
  } else {
    observations.push(
      `${invalidCodeCount} productos tienen códigos inválidos.`
    )
  }

  if (missingPercentages.brand >= 50) {
    observations.push(
      `Falta la marca en el ${missingPercentages.brand}% de los productos.`
    )
  }

  if (missingPercentages.category >= 50) {
    observations.push(
      `Falta la categoría en el ${missingPercentages.category}% de los productos.`
    )
  }

  if (missingPercentages.image >= 80) {
    observations.push(
      'La mayoría de los productos todavía necesita enriquecimiento de imágenes.'
    )
  }

  if (
    missingPercentages.quantity <= 10 &&
    missingPercentages.unit <= 10
  ) {
    observations.push(
      'La presentación y la unidad tienen una cobertura muy buena.'
    )
  }

  return observations
}