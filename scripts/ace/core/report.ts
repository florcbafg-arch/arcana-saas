import type { PreparedImport } from './importer'
import type { DatasetInspection } from './inspector'

/**
 * Muestra en la terminal el reporte general
 * de preparación de la importación.
 */
export function printImportReport(
  preparedImport: PreparedImport
): void {
  const {
    products,
    invalidProducts,
    duplicateProducts,
    stats,
    barcodeStats,
  } = preparedImport

  console.log('')
  console.log('========================================')
  console.log('        ARCANA CATALOG ENGINE')
  console.log('        REPORTE DE IMPORTACIÓN')
  console.log('========================================')
  console.log('')

  console.log(`Filas procesadas:        ${stats.total}`)
  console.log(`Productos válidos:       ${products.length}`)
  console.log(`Duplicados detectados:   ${stats.duplicated}`)
  console.log(`Productos inválidos:     ${stats.invalid}`)
  console.log('')

  console.log('Clasificación de códigos:')
  console.log(`EAN-13 válidos:          ${barcodeStats.ean13}`)
  console.log(`Códigos numéricos:       ${barcodeStats.numericCode}`)
  console.log(`Códigos inválidos:       ${barcodeStats.invalid}`)
  console.log('')

  if (invalidProducts.length > 0) {
    console.log('Primeros productos inválidos:')
    console.log('----------------------------------------')

    invalidProducts.slice(0, 10).forEach((product) => {
      console.log(
        `Fila ${product.rowNumber} | ` +
          `Código: ${product.barcode || '(vacío)'} | ` +
          `Producto: ${product.name || '(sin nombre)'}`
      )

      console.log(`Motivo: ${product.reason}`)
      console.log('')
    })

    if (invalidProducts.length > 10) {
      console.log(
        `... y ${invalidProducts.length - 10} inválidos más`
      )
      console.log('')
    }
  }

  if (duplicateProducts.length > 0) {
    console.log('Primeros productos duplicados:')
    console.log('----------------------------------------')

    duplicateProducts.slice(0, 10).forEach((product) => {
      console.log(
        `Código: ${product.barcode} | ` +
          `Producto: ${product.name}`
      )

      console.log(
        `Fila duplicada: ${product.rowNumber} | ` +
          `Fila conservada: ${product.originalRowNumber}`
      )

      console.log('')
    })

    if (duplicateProducts.length > 10) {
      console.log(
        `... y ${duplicateProducts.length - 10} duplicados más`
      )
      console.log('')
    }
  }

  console.log('========================================')
  console.log('ACE terminó el análisis del archivo.')
  console.log('Supabase todavía no fue modificado.')
  console.log('========================================')
  console.log('')
}

/**
 * Muestra el análisis profundo de calidad
 * generado por ACE Inspector.
 */
export function printDatasetInspection(
  inspection: DatasetInspection
): void {
  console.log('')
  console.log('========================================')
  console.log('             ACE INSPECTOR')
  console.log('        CALIDAD DEL DATASET')
  console.log('========================================')
  console.log('')

  console.log(`Productos analizados:    ${inspection.totalProducts}`)
  console.log(`Productos únicos:        ${inspection.uniqueProducts}`)
  console.log(`Marcas distintas:        ${inspection.uniqueBrands}`)
  console.log(`Categorías distintas:    ${inspection.uniqueCategories}`)
  console.log(`Unidades distintas:      ${inspection.uniqueUnits}`)
  console.log(`Confianza promedio:      ${inspection.averageConfidence}`)
  console.log('')

  console.log('Cobertura de códigos:')
  console.log(`EAN-13 válidos:          ${inspection.ean13Count}`)
  console.log(`Códigos numéricos:       ${inspection.numericCodeCount}`)
  console.log(`Códigos inválidos:       ${inspection.invalidCodeCount}`)
  console.log('')

  console.log('Campos faltantes:')
  console.log(
    `Marca:                  ${inspection.missingFields.brand} ` +
      `(${inspection.missingPercentages.brand}%)`
  )
  console.log(
    `Categoría:              ${inspection.missingFields.category} ` +
      `(${inspection.missingPercentages.category}%)`
  )
  console.log(
    `Imagen:                 ${inspection.missingFields.image} ` +
      `(${inspection.missingPercentages.image}%)`
  )
  console.log(
    `Cantidad:               ${inspection.missingFields.quantity} ` +
      `(${inspection.missingPercentages.quantity}%)`
  )
  console.log(
    `Unidad:                 ${inspection.missingFields.unit} ` +
      `(${inspection.missingPercentages.unit}%)`
  )
  console.log('')

  console.log('ACE DATASET HEALTH')
  console.log('----------------------------------------')
  console.log(`Puntaje:                 ${inspection.healthScore} / 100`)
  console.log(`Estado:                  ${inspection.healthLabel}`)
  console.log('')

  if (inspection.observations.length > 0) {
    console.log('Observaciones:')
    console.log('----------------------------------------')

    inspection.observations.forEach((observation) => {
      console.log(`- ${observation}`)
    })

    console.log('')
  }

  printRanking('Top marcas', inspection.topBrands)
  printRanking('Top categorías', inspection.topCategories)
  printRanking('Top unidades', inspection.topUnits)

  console.log('========================================')
  console.log('ACE Inspector terminó el análisis.')
  console.log('========================================')
  console.log('')
}

function printRanking(
  title: string,
  values: Array<{
    value: string
    count: number
  }>
): void {
  console.log(title)
  console.log('----------------------------------------')

  if (values.length === 0) {
    console.log('Sin datos disponibles.')
    console.log('')
    return
  }

  values.forEach((item, index) => {
    const position = String(index + 1).padStart(2, '0')

    console.log(
      `${position}. ${item.value} — ${item.count}`
    )
  })

  console.log('')
}