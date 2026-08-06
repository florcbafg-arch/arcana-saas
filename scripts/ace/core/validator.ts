import type { CatalogProduct } from '../types'

export type ValidationResult = {
  valid: boolean
  reason?: string
}

/**
 * Valida un producto antes de enviarlo a Supabase.
 */
export function validateCatalogProduct(
  product: CatalogProduct
): ValidationResult {
  if (!product.barcode) {
    return {
      valid: false,
      reason: 'Código de barras vacío',
    }
  }

  if (!/^\d+$/.test(product.barcode)) {
    return {
      valid: false,
      reason: 'El código contiene caracteres no numéricos',
    }
  }

  if (product.barcode.length < 6) {
    return {
      valid: false,
      reason: `Código demasiado corto: ${product.barcode.length} dígitos`,
    }
  }

  if (product.barcode.length > 18) {
    return {
      valid: false,
      reason: `Código demasiado largo: ${product.barcode.length} dígitos`,
    }
  }

  if (!product.name) {
    return {
      valid: false,
      reason: 'Nombre vacío',
    }
  }

  if (product.name.length < 2) {
    return {
      valid: false,
      reason: 'Nombre demasiado corto',
    }
  }

  if (product.name.length > 250) {
    return {
      valid: false,
      reason: 'Nombre demasiado largo',
    }
  }

  if (product.confidence < 0 || product.confidence > 100) {
    return {
      valid: false,
      reason: 'Nivel de confianza fuera de rango',
    }
  }

  return {
    valid: true,
  }
}

/**
 * Verifica si un código parece ser EAN-13 válido.
 *
 * Esto no decide si el producto se importa.
 * Solo sirve para clasificar y reportar.
 */
export function isValidEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) {
    return false
  }

  const digits = barcode.split('').map(Number)
  const expectedCheckDigit = digits[12]

  const sum = digits
    .slice(0, 12)
    .reduce((total, digit, index) => {
      return total + digit * (index % 2 === 0 ? 1 : 3)
    }, 0)

  const calculatedCheckDigit = (10 - (sum % 10)) % 10

  return calculatedCheckDigit === expectedCheckDigit
}

/**
 * Clasifica el tipo de código para los reportes.
 */
export function classifyBarcode(
  barcode: string
): 'ean13' | 'numeric_code' | 'invalid' {
  if (!barcode || !/^\d+$/.test(barcode)) {
    return 'invalid'
  }

  if (isValidEAN13(barcode)) {
    return 'ean13'
  }

  return 'numeric_code'
}