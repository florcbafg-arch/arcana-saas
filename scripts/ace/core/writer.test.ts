import { readEaxaFile } from '../adapters/eaxa'
import { prepareCatalogImport } from './importer'
import { readCatalogProductsByBarcodes } from './supabase-reader'
import { createCatalogSyncPlan } from './planner'
import { executeCatalogPlan } from './writer'

async function run(): Promise<void> {
  try {
    const filePath =
      'C:\\Users\\flor\\Desktop\\productos.csv'

    console.log('')
    console.log(
      'ACE Writer está preparando una simulación...'
    )
    console.log('')

    const adapterResult =
      readEaxaFile(filePath)

    const preparedImport =
      prepareCatalogImport(
        adapterResult.products
      )

    const barcodes =
      preparedImport.products.map(
        (product) => product.barcode
      )

    const catalogResult =
      await readCatalogProductsByBarcodes(
        barcodes
      )

    const plan =
      createCatalogSyncPlan(
        preparedImport.products,
        catalogResult.productsByBarcode
      )

    const result =
      await executeCatalogPlan(
        plan,
        'dry-run'
      )

    console.log('========================================')
    console.log('              ACE WRITER')
    console.log('             DRY RUN TEST')
    console.log('========================================')
    console.log('')

    console.log(
      `Insertaría:    ${result.plannedInserts}`
    )

    console.log(
      `Actualizaría:  ${result.plannedUpdates}`
    )

    console.log(
      `Mantendría:    ${result.plannedKeeps}`
    )

    console.log('')
    console.log(
      `Insertados reales:   ${result.inserted}`
    )

    console.log(
      `Actualizados reales: ${result.updated}`
    )

    console.log(
      `Fallidos:            ${result.failed}`
    )

    console.log('')
    console.log(
      'Modo dry-run: Supabase no fue modificado.'
    )
    console.log('')
  } catch (error) {
    console.error('')
    console.error(
      'La prueba del ACE Writer falló.'
    )
    console.error('')

    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(
        'Ocurrió un error desconocido.'
      )
    }

    process.exitCode = 1
  }
}

void run()