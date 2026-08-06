type ComparableMeasurement = {
  baseValue: number
  family: 'mass' | 'volume' | 'unit'
}

/**
 * Convierte cantidad + unidad a una medida comparable.
 *
 * Ejemplos:
 * 2.5 litro  -> 2500 ml
 * 2500 ml    -> 2500 ml
 *
 * 1 kg       -> 1000 g
 * 1000 g     -> 1000 g
 */
export function normalizeMeasurement(
  quantity: string | null,
  unit: string | null
): ComparableMeasurement | null {
  if (!quantity || !unit) {
    return null
  }

  const numericValue = Number(
    quantity.replace(',', '.')
  )

  if (!Number.isFinite(numericValue)) {
    return null
  }

  const normalizedUnit = unit
    .trim()
    .toLowerCase()

  if (
    normalizedUnit === 'litro' ||
    normalizedUnit === 'l' ||
    normalizedUnit === 'lt'
  ) {
    return {
      baseValue: numericValue * 1000,
      family: 'volume',
    }
  }

  if (normalizedUnit === 'ml') {
    return {
      baseValue: numericValue,
      family: 'volume',
    }
  }

  if (
    normalizedUnit === 'kg' ||
    normalizedUnit === 'kilo'
  ) {
    return {
      baseValue: numericValue * 1000,
      family: 'mass',
    }
  }

  if (
    normalizedUnit === 'g' ||
    normalizedUnit === 'gr'
  ) {
    return {
      baseValue: numericValue,
      family: 'mass',
    }
  }

  if (
    normalizedUnit === 'unidad' ||
    normalizedUnit === 'un'
  ) {
    return {
      baseValue: numericValue,
      family: 'unit',
    }
  }

  return null
}

/**
 * Comprueba si dos presentaciones representan
 * físicamente la misma cantidad.
 */
export function areMeasurementsEquivalent(
  currentQuantity: string | null,
  currentUnit: string | null,
  incomingQuantity: string | null,
  incomingUnit: string | null
): boolean {
  const current = normalizeMeasurement(
    currentQuantity,
    currentUnit
  )

  const incoming = normalizeMeasurement(
    incomingQuantity,
    incomingUnit
  )

  if (!current || !incoming) {
    return false
  }

  if (current.family !== incoming.family) {
    return false
  }

  return (
    Math.abs(
      current.baseValue -
      incoming.baseValue
    ) < 0.001
  )
}