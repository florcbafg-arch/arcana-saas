import { normalizeSearchText } from './normalizer'

/**
 * Genera palabras clave limpias y sin repetir
 * para mejorar las búsquedas dentro de arcana_catalog.
 */
export function buildSearchKeywords(
  values: Array<string | null | undefined>
): string[] {
  const keywords = new Set<string>()

  for (const value of values) {
    if (!value) continue

    const normalized = normalizeSearchText(value)

    if (!normalized) continue

    // Guardamos la frase completa.
    keywords.add(normalized)

    // También guardamos cada palabra por separado.
    for (const word of normalized.split(' ')) {
      const cleanWord = word.trim()

      if (cleanWord.length > 1) {
        keywords.add(cleanWord)
      }
    }
  }

  return Array.from(keywords)
}

/**
 * Crea las palabras clave principales de un producto.
 */
export function buildProductSearchKeywords(product: {
  barcode: string
  name: string
  brand: string | null
  category: string | null
  quantity: string | null
  unit: string | null
}): string[] {
  return buildSearchKeywords([
    product.barcode,
    product.name,
    product.brand,
    product.category,
    product.quantity,
    product.unit,
    product.quantity && product.unit
      ? `${product.quantity} ${product.unit}`
      : null,
  ])
}