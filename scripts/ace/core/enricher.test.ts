import {
  readCatalogProductsByBarcodes,
} from './supabase-reader'

import {
  enrichCatalogProducts,
} from './enricher'

async function run(): Promise<void> {
  try {
    /*
     * Usamos un producto real que ya exista
     * en arcana_catalog y tenga EAN-13.
     *
     * Cambialo si este código no existe
     * en tu catálogo global.
     */
    const barcodes = [
      '7790895005794',
    ]

    console.log('')
    console.log('========================================')
    console.log('        ACE ENRICHMENT ENGINE')
    console.log('            DRY RUN TEST')
    console.log('========================================')
    console.log('')

    const catalog =
      await readCatalogProductsByBarcodes(
        barcodes
      )

    const products =
      Array.from(
        catalog.productsByBarcode.values()
      )

    if (products.length === 0) {
      console.log(
        'El producto de prueba no existe en arcana_catalog.'
      )
      console.log('')
      console.log(
        'Usá un EAN-13 real que sí exista en el catálogo global.'
      )
      return
    }

    const result =
      await enrichCatalogProducts(
        products
      )

    console.log(
      `Productos analizados: ${result.stats.total}`
    )

    console.log(
      `Aptos para OFF:       ${result.stats.eligible}`
    )

    console.log(
      `Encontrados en OFF:   ${result.stats.found}`
    )

    console.log(
      `No encontrados:       ${result.stats.notFound}`
    )

    console.log(
      `Productos mejorados:  ${result.stats.improved}`
    )

    console.log(
      `Sin mejoras:          ${result.stats.unchanged}`
    )

    console.log(
      `Errores:              ${result.stats.failed}`
    )

    console.log('')

    if (result.plan.updates.length > 0) {
      console.log('MEJORAS PROPUESTAS')
      console.log(
        '----------------------------------------'
      )

      for (
        const item
        of result.plan.updates
      ) {
        console.log(
          `${item.barcode} | ${item.finalProduct.name}`
        )

        item.reasons.forEach(
          (reason) => {
            console.log(
              `- ${reason}`
            )
          }
        )

        console.log('')
      }
    }

    console.log(
      'Modo prueba: Supabase no fue modificado.'
    )
    console.log('')

  } catch (error) {
    console.error('')
    console.error(
      'La prueba del Enrichment Engine falló.'
    )

    console.error('')

    if (error instanceof Error) {
      console.error(
        error.message
      )
    }

    process.exitCode = 1
  }
}

void run()