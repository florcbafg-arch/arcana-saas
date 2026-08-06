import type {
  CatalogProduct,
  CatalogSyncPlan,
} from '../types'

import {
  applyCatalogTransaction,
} from './transaction'

function createTestProduct(
  barcode: string,
  name: string
): CatalogProduct {
  return {
    barcode,
    name,
    brand: 'ACE TEST',
    category: 'PRUEBA',
    image_url: null,
    quantity: '1',
    unit: 'unidad',
    source: 'ace_transaction_test',
    country: 'AR',
    confidence: 100,
    verified: true,
    is_global: true,
    times_used: 0,
    search_keywords: [
      barcode,
      'ace',
      'test',
      name.toLowerCase(),
    ],
    created_by: null,
  }
}

async function run(): Promise<void> {
  try {
    /*
     * Código reservado exclusivamente
     * para esta prueba.
     */
    const testBarcode =
      '9900000000001'

    const testProduct =
      createTestProduct(
        testBarcode,
        'ACE TRANSACTION TEST'
      )

    const plan: CatalogSyncPlan = {
      total: 1,

      inserts: [
        {
          barcode: testBarcode,
          action: 'insert',
          incomingProduct: testProduct,
          currentProduct: null,
          finalProduct: testProduct,
          reasons: [
            'Producto temporal para probar transacciones.',
          ],
        },
      ],

      updates: [],

      keeps: [],
    }

    console.log('')
    console.log('========================================')
    console.log('       ACE TRANSACTION ENGINE')
    console.log('          COMMIT TEST')
    console.log('========================================')
    console.log('')

    const result =
      await applyCatalogTransaction(plan)

    console.log(
      `Transacción exitosa: ${result.success ? 'Sí' : 'No'}`
    )

    console.log(
      `Insertados:          ${result.inserted}`
    )

    console.log(
      `Actualizados:        ${result.updated}`
    )

    console.log(
      `Sin cambios:         ${result.kept}`
    )

    console.log('')
    console.log(
      'La prueba COMMIT terminó correctamente.'
    )
    console.log('')
  } catch (error) {
    console.error('')
    console.error(
      'La prueba del Transaction Engine falló.'
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