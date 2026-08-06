import type { CatalogProduct } from '../types'

import {
  normalizeBrand,
  normalizeOptionalText,
  normalizeProductName,
  normalizeQuantity,
  normalizeUnit,
} from '../core/normalizer'

import { buildProductSearchKeywords } from '../core/keywords'

type OpenFoodFactsResponse = {
  status?: number
  product?: {
    product_name?: string
    product_name_es?: string

    brands?: string

    categories?: string
    categories_tags?: string[]

    image_front_url?: string
    image_url?: string

    quantity?: string

    product_quantity?: string | number

    product_quantity_unit?: string

    serving_quantity?: string | number
  }
}

export type OpenFoodFactsLookupResult = {
  found: boolean
  barcode: string
  product: CatalogProduct | null
  reason?: string
}

/**
 * Consulta Open Food Facts por código de barras.
 *
 * No modifica Supabase.
 */
export async function fetchOpenFoodFactsProduct(
  barcode: string
): Promise<OpenFoodFactsLookupResult> {
  const cleanBarcode = String(barcode ?? '').trim()

  if (!/^\d{13}$/.test(cleanBarcode)) {
    return {
      found: false,
      barcode: cleanBarcode,
      product: null,
      reason: 'El código no es EAN-13.',
    }
  }

  const url =
    `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`

  const response = await fetch(url, {
    headers: {
      /*
       * Open Food Facts recomienda identificar
       * claramente la aplicación que consulta su API.
       */
      'User-Agent':
        'ArcanaCatalogEngine/1.0 (Arcana POS)',
    },
  })

  if (!response.ok) {
    return {
      found: false,
      barcode: cleanBarcode,
      product: null,
      reason:
        `Open Food Facts respondió HTTP ${response.status}.`,
    }
  }

  const data =
    (await response.json()) as OpenFoodFactsResponse

  if (
    data.status !== 1 ||
    !data.product
  ) {
    return {
      found: false,
      barcode: cleanBarcode,
      product: null,
      reason:
        'El producto no existe en Open Food Facts.',
    }
  }

  const product =
    mapOpenFoodFactsToCatalogProduct(
      cleanBarcode,
      data.product
    )

  return {
    found: true,
    barcode: cleanBarcode,
    product,
  }
}

function mapOpenFoodFactsToCatalogProduct(
  barcode: string,
  rawProduct: NonNullable<
    OpenFoodFactsResponse['product']
  >
): CatalogProduct {
  const rawName =
    rawProduct.product_name_es ||
    rawProduct.product_name ||
    ''

  const name =
    normalizeProductName(rawName)

  const brand =
    normalizeBrand(rawProduct.brands)

  const category =
    extractCategory(rawProduct)

  const imageUrl =
    normalizeOptionalText(
      rawProduct.image_front_url ||
      rawProduct.image_url
    )

  const {
    quantity,
    unit,
  } = extractQuantityAndUnit(rawProduct)

  const baseProduct = {
    barcode,
    name,
    brand,
    category,
    image_url: imageUrl,
    quantity,
    unit,
  }

  return {
    ...baseProduct,

    source: 'openfoodfacts',
    country: 'AR',

    /*
     * OFF es una fuente externa colaborativa.
     * Le damos buena confianza,
     * pero no la consideramos absoluta.
     */
    confidence: 85,

    verified: false,
    is_global: true,
    times_used: 0,

    search_keywords:
      buildProductSearchKeywords(
        baseProduct
      ),

    created_by: null,
  }
}

function extractCategory(
  product: NonNullable<
    OpenFoodFactsResponse['product']
  >
): string | null {
  const directCategory =
    normalizeOptionalText(
      product.categories
    )

  if (directCategory) {
    const firstCategory =
      directCategory.split(',')[0]?.trim()

    return firstCategory || null
  }

  const firstTag =
    product.categories_tags?.[0]

  if (!firstTag) {
    return null
  }

  return firstTag
    .replace(/^..:/, '')
    .replace(/-/g, ' ')
    .trim()
    .toUpperCase() || null
}

function extractQuantityAndUnit(
  product: NonNullable<
    OpenFoodFactsResponse['product']
  >
): {
  quantity: string | null
  unit: string | null
} {
  /*
   * Preferimos los campos estructurados.
   */
  if (
    product.product_quantity !== undefined &&
    product.product_quantity !== null
  ) {
    return {
      quantity: normalizeQuantity(
        product.product_quantity
      ),

      unit: normalizeUnit(
        product.product_quantity_unit
      ),
    }
  }

  /*
   * Si no existen, intentamos interpretar
   * el campo quantity, por ejemplo:
   *
   * "1.5 L"
   * "500 g"
   */
  const rawQuantity =
    normalizeOptionalText(
      product.quantity
    )

  if (!rawQuantity) {
    return {
      quantity: null,
      unit: null,
    }
  }

  const match = rawQuantity.match(
    /([\d.,]+)\s*([a-zA-Z]+)/i
  )

  if (!match) {
    return {
      quantity: normalizeQuantity(
        rawQuantity
      ),
      unit: null,
    }
  }

  return {
    quantity: normalizeQuantity(
      match[1]
    ),

    unit: normalizeUnit(
      match[2]
    ),
  }
}