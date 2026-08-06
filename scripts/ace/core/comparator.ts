import type {
  CatalogComparisonResult,
  CatalogFieldChange,
  CatalogProduct,
  ComparableCatalogField,
} from '../types'
import {
  areMeasurementsEquivalent,
} from './measurement'

const COMPARABLE_FIELDS: ComparableCatalogField[] = [
  'name',
  'brand',
  'category',
  'image_url',
  'quantity',
  'unit',
]

/**
 * Compara el producto que Arcana ya conoce
 * con uno nuevo procedente de cualquier fuente.
 *
 * Esta función no modifica Supabase.
 * Solo genera una decisión de combinación.
 */
export function compareCatalogProducts(
  currentProduct: CatalogProduct,
  incomingProduct: CatalogProduct
): CatalogComparisonResult {
  if (currentProduct.barcode !== incomingProduct.barcode) {
    throw new Error(
      [
        'ACE no puede comparar productos con códigos diferentes.',
        `Código actual: ${currentProduct.barcode}`,
        `Código entrante: ${incomingProduct.barcode}`,
      ].join('\n')
    )
  }

  const equivalentMeasurement =
  areMeasurementsEquivalent(
    currentProduct.quantity,
    currentProduct.unit,
    incomingProduct.quantity,
    incomingProduct.unit
  )

  const changes: CatalogFieldChange[] = []

  for (const field of COMPARABLE_FIELDS) {
if (
  equivalentMeasurement &&
  (field === 'quantity' || field === 'unit')
) {
  changes.push({
    field,
    currentValue:
      currentProduct[field],
    incomingValue:
      incomingProduct[field],
    selectedValue:
      currentProduct[field],
    action: 'keep',
    reason:
      'Ambas presentaciones representan la misma cantidad física.',
  })

  continue
}

    changes.push(
      compareField(
        field,
        currentProduct[field],
        incomingProduct[field],
        currentProduct,
        incomingProduct
      )
    )
  }

  const mergedProduct: CatalogProduct = {
    ...currentProduct,

    name: getSelectedValue(changes, 'name') ?? currentProduct.name,

    brand: getSelectedValue(changes, 'brand'),

    category: getSelectedValue(changes, 'category'),

    image_url: getSelectedValue(changes, 'image_url'),

    quantity: getSelectedValue(changes, 'quantity'),

    unit: getSelectedValue(changes, 'unit'),

    search_keywords: mergeKeywords(
      currentProduct.search_keywords,
      incomingProduct.search_keywords
    ),

    /*
     * Nunca reducimos la confianza.
     */
    confidence: Math.max(
      currentProduct.confidence,
      incomingProduct.confidence
    ),

    /*
     * Conservamos la validación si alguna fuente
     * ya confirmó el producto.
     */
    verified:
      currentProduct.verified ||
      incomingProduct.verified,

    /*
     * Conservamos el mayor nivel de uso registrado.
     * La importación no debe simular ventas o consultas.
     */
    times_used: Math.max(
      currentProduct.times_used,
      incomingProduct.times_used
    ),

    /*
     * El catálogo sigue siendo global si alguna
     * de las dos versiones ya lo era.
     */
    is_global:
      currentProduct.is_global ||
      incomingProduct.is_global,

    /*
     * Conservamos la fuente principal actual.
     * Más adelante podremos registrar todas las fuentes
     * en una tabla histórica independiente.
     */
    source: currentProduct.source,

    country:
      currentProduct.country ||
      incomingProduct.country,

    created_by:
      currentProduct.created_by ??
      incomingProduct.created_by ??
      null,
  }

  return {
    barcode: currentProduct.barcode,

    hasChanges: changes.some(
      (change) =>
        change.action === 'fill' ||
        change.action === 'replace'
    ),

    changes,

    mergedProduct,
  }
}

/**
 * Decide qué hacer con un campo individual.
 */
function compareField(
  field: ComparableCatalogField,
  currentValue: string | null,
  incomingValue: string | null,
  currentProduct: CatalogProduct,
  incomingProduct: CatalogProduct
): CatalogFieldChange {
  const current = cleanComparableValue(currentValue)
  const incoming = cleanComparableValue(incomingValue)

  if (!incoming) {
    return {
      field,
      currentValue: current,
      incomingValue: incoming,
      selectedValue: current,
      action: 'keep',
      reason:
        'El dato entrante está vacío; se conserva la información existente.',
    }
  }

  if (!current) {
    return {
      field,
      currentValue: current,
      incomingValue: incoming,
      selectedValue: incoming,
      action: 'fill',
      reason:
        'Arcana no tenía este dato; se completa con la nueva información.',
    }
  }

  if (normalizeForComparison(current) === normalizeForComparison(incoming)) {
    return {
      field,
      currentValue: current,
      incomingValue: incoming,
      selectedValue: current,
      action: 'keep',
      reason:
        'Ambas fuentes contienen el mismo dato.',
    }
  }

  const shouldReplace = isIncomingValueBetter({
    field,
    currentValue: current,
    incomingValue: incoming,
    currentProduct,
    incomingProduct,
  })

  if (shouldReplace) {
    return {
      field,
      currentValue: current,
      incomingValue: incoming,
      selectedValue: incoming,
      action: 'replace',
      reason:
        'El nuevo dato fue considerado más completo o confiable.',
    }
  }

  return {
    field,
    currentValue: current,
    incomingValue: incoming,
    selectedValue: current,
    action: 'keep',
    reason:
      'La información existente tiene igual o mayor calidad.',
  }
}

function isIncomingValueBetter(input: {
  field: ComparableCatalogField
  currentValue: string
  incomingValue: string
  currentProduct: CatalogProduct
  incomingProduct: CatalogProduct
}): boolean {
  const {
    field,
    currentValue,
    incomingValue,
    currentProduct,
    incomingProduct,
  } = input

  /*
   * Una fuente verificada puede mejorar
   * una fuente que todavía no fue verificada.
   */
  if (
    incomingProduct.verified &&
    !currentProduct.verified
  ) {
    return true
  }

  /*
   * Una fuente con mayor confianza puede reemplazar
   * un dato menos confiable, siempre que no esté vacío.
   */
  if (
    incomingProduct.confidence >
    currentProduct.confidence
  ) {
    return true
  }

  /*
   * Reglas especiales según el campo.
   */
  if (field === 'name') {
    return isBetterName(
      currentValue,
      incomingValue
    )
  }

  if (field === 'image_url') {
    return isBetterImageUrl(
      currentValue,
      incomingValue
    )
  }

  /*
   * Para marca, categoría, cantidad y unidad,
   * si ambas fuentes tienen igual confianza,
   * conservamos el dato actual.
   */
  return false
}

function isBetterName(
  currentName: string,
  incomingName: string
): boolean {
  const currentWords = countUsefulWords(currentName)
  const incomingWords = countUsefulWords(incomingName)

  /*
   * Preferimos nombres con más información,
   * pero evitamos reemplazar por textos exageradamente largos.
   */
  return (
    incomingWords > currentWords &&
    incomingName.length <= 250
  )
}

function isBetterImageUrl(
  currentUrl: string,
  incomingUrl: string
): boolean {
  if (!currentUrl && incomingUrl) {
    return true
  }

  /*
   * Preferimos HTTPS sobre HTTP.
   */
  if (
    incomingUrl.startsWith('https://') &&
    currentUrl.startsWith('http://')
  ) {
    return true
  }

  return false
}

function getSelectedValue(
  changes: CatalogFieldChange[],
  field: ComparableCatalogField
): string | null {
  return (
    changes.find(
      (change) => change.field === field
    )?.selectedValue ?? null
  )
}

function cleanComparableValue(
  value: string | null | undefined
): string | null {
  const cleaned = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || null
}

function normalizeForComparison(
  value: string
): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function countUsefulWords(
  value: string
): number {
  return normalizeForComparison(value)
    .split(' ')
    .filter((word) => word.length > 1)
    .length
}

function mergeKeywords(
  currentKeywords: string[],
  incomingKeywords: string[]
): string[] {
  return Array.from(
    new Set([
      ...currentKeywords,
      ...incomingKeywords,
    ])
  )
}