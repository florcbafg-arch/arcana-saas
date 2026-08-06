export type MeasurementFamily =
  | 'volume'
  | 'mass'
  | 'unit'

export type NormalizedMeasurement = {
  originalQuantity: string | null
  originalUnit: string | null

  numericValue: number
  normalizedUnit: string

  baseValue: number
  baseUnit: 'ml' | 'g' | 'unidad'

  family: MeasurementFamily
}

export type MeasurementComparison = {
  equivalent: boolean
  current: NormalizedMeasurement | null
  incoming: NormalizedMeasurement | null
}

/**
 * Convierte cantidad + unidad a una representación
 * física comparable.
 *
 * Soporta casos como:
 *
 * quantity = "2,5 L"
 * unit = "litro"
 *
 * quantity = "2500"
 * unit = "ml"
 */
export function normalizeMeasurement(
  quantity: string | null,
  unit: string | null
): NormalizedMeasurement | null {
  const parsed =
    extractQuantityAndUnit(
      quantity,
      unit
    )

  if (!parsed) {
    return null
  }

  const {
    numericValue,
    normalizedUnit,
  } = parsed

  switch (normalizedUnit) {
    case 'ml':
      return {
        originalQuantity: quantity,
        originalUnit: unit,
        numericValue,
        normalizedUnit,
        baseValue: numericValue,
        baseUnit: 'ml',
        family: 'volume',
      }

    case 'litro':
      return {
        originalQuantity: quantity,
        originalUnit: unit,
        numericValue,
        normalizedUnit,
        baseValue:
          numericValue * 1000,
        baseUnit: 'ml',
        family: 'volume',
      }

    case 'g':
      return {
        originalQuantity: quantity,
        originalUnit: unit,
        numericValue,
        normalizedUnit,
        baseValue: numericValue,
        baseUnit: 'g',
        family: 'mass',
      }

    case 'kg':
      return {
        originalQuantity: quantity,
        originalUnit: unit,
        numericValue,
        normalizedUnit,
        baseValue:
          numericValue * 1000,
        baseUnit: 'g',
        family: 'mass',
      }

    case 'unidad':
      return {
        originalQuantity: quantity,
        originalUnit: unit,
        numericValue,
        normalizedUnit,
        baseValue: numericValue,
        baseUnit: 'unidad',
        family: 'unit',
      }

    default:
      return null
  }
}

/**
 * Determina si dos presentaciones representan
 * exactamente la misma cantidad física.
 */
export function compareMeasurements(
  currentQuantity: string | null,
  currentUnit: string | null,
  incomingQuantity: string | null,
  incomingUnit: string | null
): MeasurementComparison {
  const current =
    normalizeMeasurement(
      currentQuantity,
      currentUnit
    )

  const incoming =
    normalizeMeasurement(
      incomingQuantity,
      incomingUnit
    )

  if (!current || !incoming) {
    return {
      equivalent: false,
      current,
      incoming,
    }
  }

  if (
    current.family !==
    incoming.family
  ) {
    return {
      equivalent: false,
      current,
      incoming,
    }
  }

  /*
   * Pequeña tolerancia para evitar problemas
   * de coma flotante.
   */
  const difference =
    Math.abs(
      current.baseValue -
      incoming.baseValue
    )

  return {
    equivalent:
      difference < 0.001,

    current,
    incoming,
  }
}

/**
 * Atajo utilizado por Comparator.
 */
export function areMeasurementsEquivalent(
  currentQuantity: string | null,
  currentUnit: string | null,
  incomingQuantity: string | null,
  incomingUnit: string | null
): boolean {
  return compareMeasurements(
    currentQuantity,
    currentUnit,
    incomingQuantity,
    incomingUnit
  ).equivalent
}

function extractQuantityAndUnit(
  quantity: string | null,
  unit: string | null
): {
  numericValue: number
  normalizedUnit: string
} | null {
  const quantityText =
    String(quantity ?? '')
      .trim()
      .toLowerCase()

  const explicitUnit =
    normalizeUnitName(unit)

  /*
   * Buscamos el primer número incluso si quantity
   * contiene algo como:
   *
   * "2,5 L"
   * "500 gr"
   * "1 KG"
   */
  const numberMatch =
    quantityText.match(
      /(\d+(?:[.,]\d+)?)/
    )

  if (!numberMatch) {
    return null
  }

  const numericValue =
    Number(
      numberMatch[1]
        .replace(',', '.')
    )

  if (!Number.isFinite(numericValue)) {
    return null
  }

  /*
   * Intentamos detectar una unidad embebida
   * dentro de quantity.
   */
  const embeddedUnit =
    detectEmbeddedUnit(
      quantityText
    )

  /*
   * Si quantity ya trae explícitamente una unidad,
   * esa información tiene prioridad.
   *
   * Ejemplo:
   * quantity = "2,5 L"
   * unit = "litro"
   *
   * Ambas coinciden igualmente.
   */
  const normalizedUnit =
    embeddedUnit ??
    explicitUnit

  if (!normalizedUnit) {
    return null
  }

  return {
    numericValue,
    normalizedUnit,
  }
}

function detectEmbeddedUnit(
  value: string
): string | null {
  const normalized =
    value
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()

  /*
   * Orden importante:
   * detectamos "ml" antes de "l",
   * y "kg" antes de "g".
   */
  if (
    /\bml\b/.test(normalized) ||
    /\bmililitros?\b/.test(normalized)
  ) {
    return 'ml'
  }

  if (
    /\blt?s?\b/.test(normalized) ||
    /\blitros?\b/.test(normalized)
  ) {
    return 'litro'
  }

  if (
    /\bkg\b/.test(normalized) ||
    /\bkilos?\b/.test(normalized) ||
    /\bkilogramos?\b/.test(normalized)
  ) {
    return 'kg'
  }

  if (
    /\bgr?s?\b/.test(normalized) ||
    /\bg\b/.test(normalized) ||
    /\bgramos?\b/.test(normalized)
  ) {
    return 'g'
  }

  if (
    /\bunidades?\b/.test(normalized) ||
    /\bun\b/.test(normalized) ||
    /\bu\b/.test(normalized)
  ) {
    return 'unidad'
  }

  return null
}

function normalizeUnitName(
  unit: string | null
): string | null {
  const normalized =
    String(unit ?? '')
      .trim()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()

  if (!normalized) {
    return null
  }

  if (
    normalized === 'ml' ||
    normalized === 'mililitro' ||
    normalized === 'mililitros'
  ) {
    return 'ml'
  }

  if (
    normalized === 'l' ||
    normalized === 'lt' ||
    normalized === 'lts' ||
    normalized === 'litro' ||
    normalized === 'litros'
  ) {
    return 'litro'
  }

  if (
    normalized === 'kg' ||
    normalized === 'kgs' ||
    normalized === 'kilo' ||
    normalized === 'kilos' ||
    normalized === 'kilogramo' ||
    normalized === 'kilogramos'
  ) {
    return 'kg'
  }

  if (
    normalized === 'g' ||
    normalized === 'gr' ||
    normalized === 'grs' ||
    normalized === 'gramo' ||
    normalized === 'gramos'
  ) {
    return 'g'
  }

  if (
    normalized === 'u' ||
    normalized === 'un' ||
    normalized === 'unidad' ||
    normalized === 'unidades'
  ) {
    return 'unidad'
  }

  return null
}