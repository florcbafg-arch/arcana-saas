import type { PreparedImport } from './importer'

/**
 * Muestra en la terminal un resumen claro
 * del archivo procesado por ACE.
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