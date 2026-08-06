/**
 * Convierte cualquier valor en texto limpio.
 * Conserva tildes y caracteres propios de los nombres comerciales.
 */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normaliza textos opcionales.
 * Devuelve null cuando el campo está vacío.
 */
export function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value)

  return normalized.length > 0 ? normalized : null
}

/**
 * Limpia el código de barras.
 *
 * Importante:
 * - Se mantiene como texto.
 * - Conserva ceros iniciales.
 * - Elimina espacios y caracteres no numéricos.
 */
export function normalizeBarcode(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  let barcode = String(value).trim()

  // Algunos Excel convierten códigos en valores como 7791234567890.0
  barcode = barcode.replace(/\.0$/, '')

  // Algunos archivos utilizan notación científica.
  // No intentamos reconstruirla acá porque podría producir códigos incorrectos.
  if (/e[+-]?\d+/i.test(barcode)) {
    return ''
  }

  return barcode.replace(/\D/g, '')
}

/**
 * Limpia el nombre del producto.
 * Por ahora mantenemos mayúsculas para respetar el archivo original.
 */
export function normalizeProductName(value: unknown): string {
  return normalizeText(value).toUpperCase()
}

/**
 * Normaliza la marca del producto.
 */
export function normalizeBrand(value: unknown): string | null {
  const brand = normalizeOptionalText(value)

  return brand ? brand.toUpperCase() : null
}

/**
 * Normaliza cantidades o presentaciones.
 *
 * Ejemplos:
 * "1,5"  → "1.5"
 * " 500 " → "500"
 */
export function normalizeQuantity(value: unknown): string | null {
  const quantity = normalizeOptionalText(value)

  if (!quantity) {
    return null
  }

  return quantity.replace(',', '.')
}

/**
 * Convierte diferentes formas de escribir una unidad
 * al formato utilizado por Arcana.
 */
export function normalizeUnit(value: unknown): string | null {
  const rawUnit = normalizeText(value).toLowerCase()

  if (!rawUnit) {
    return null
  }

  const unit = rawUnit
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (
    unit === 'u' ||
    unit === 'un' ||
    unit === 'ud' ||
    unit === 'unidad' ||
    unit === 'unidades'
  ) {
    return 'unidad'
  }

  if (
    unit === 'kg' ||
    unit === 'kgs' ||
    unit === 'kilo' ||
    unit === 'kilos' ||
    unit === 'kilogramo' ||
    unit === 'kilogramos'
  ) {
    return 'kg'
  }

  if (
    unit === 'g' ||
    unit === 'gr' ||
    unit === 'grs' ||
    unit === 'gramo' ||
    unit === 'gramos'
  ) {
    return 'g'
  }

  if (
    unit === 'l' ||
    unit === 'lt' ||
    unit === 'lts' ||
    unit === 'litro' ||
    unit === 'litros'
  ) {
    return 'litro'
  }

  if (
    unit === 'ml' ||
    unit === 'mililitro' ||
    unit === 'mililitros'
  ) {
    return 'ml'
  }

  if (
    unit === 'pack' ||
    unit === 'paquete' ||
    unit === 'paquetes'
  ) {
    return 'pack'
  }

  if (
    unit === 'caja' ||
    unit === 'cajas'
  ) {
    return 'caja'
  }

  if (
    unit === 'docena' ||
    unit === 'docenas'
  ) {
    return 'docena'
  }

  return rawUnit
}

/**
 * Normaliza un texto para búsquedas.
 *
 * Ejemplo:
 * "Café La Virginia" → "cafe la virginia"
 */
export function normalizeSearchText(value: unknown): string {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}