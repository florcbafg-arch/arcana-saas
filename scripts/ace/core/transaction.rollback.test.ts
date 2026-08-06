import type {
  CatalogProduct,
  CatalogSyncPlan,
} from '../types'

import {
  applyCatalogTransaction,
} from './transaction'

import {
  readCatalogProductsByBarcodes,
} from './supabase-reader'

function createTestProduct(
  barcode: string,
  name: string
): CatalogProduct {
  return {
    barcode,
    name,
    brand: 'ACE TEST',
    category: 'PRUEBA ROLLBACK',
    image_url: null,
    quantity: '1',
    unit: 'unidad',
    source: 'ace_rollback_test',
    country: 'AR',
    confidence: 100,
    verified: true,
    is_global: true,
    times_used: 0,
    search_keywords: [
      barcode,
      'ace',
      'rollback',
      'test',
    ],
    created_by: null,
  }
}

async function run(): Promise<void> {
  /*
   * Este código debería intentar insertarse,
   * pero NO debe sobrevivir al rollback.
   */
  const insertBarcode = '9900000000002'

  /*
   * Este código está preparado para representar
   * un UPDATE sobre un producto inexistente.
   *
   * La función SQL exige que cada UPDATE afecte
   * exactamente una fila. Como no existirá,
   * lanzará una excepción.
   */
  const impossibleUpdateBarcode =
    '9999999999998'

  const insertProduct =
    createTestProduct(
      insertBarcode,
      'ACE ROLLBACK INSERT TEST'
    )

  const impossibleUpdateProduct =
    createTestProduct(
      impossibleUpdateBarcode,
      'ACE IMPOSSIBLE UPDATE TEST'
    )

  const plan: CatalogSyncPlan = {
    total: 2,

    inserts: [
      {
        barcode: insertBarcode,
        action: 'insert',
        incomingProduct: insertProduct,
        currentProduct: null,
        finalProduct: insertProduct,
        reasons: [
          'Producto temporal para comprobar rollback.',
        ],
      },
    ],

    updates: [
      {
        barcode: impossibleUpdateBarcode,
        action: 'update',
        incomingProduct:
          impossibleUpdateProduct,

        /*
         * Solo construimos este producto
         * para satisfacer la estructura del plan.
         *
         * En Supabase el código NO debe existir.
         */
        currentProduct:
          impossibleUpdateProduct,

        finalProduct:
          impossibleUpdateProduct,

        reasons: [
          'UPDATE intencionalmente imposible para provocar rollback.',
        ],
      },
    ],

    keeps: [],
  }

  console.log('')
  console.log('========================================')
  console.log('       ACE TRANSACTION ENGINE')
  console.log('         ROLLBACK TEST')
  console.log('========================================')
  console.log('')

  let rollbackTriggered = false

  try {
    await applyCatalogTransaction(plan)

    console.error(
      'ERROR: La transacción no falló como esperábamos.'
    )

    process.exitCode = 1
    return
  } catch (error) {
    rollbackTriggered = true

    console.log(
      'Error intencional detectado correctamente.'
    )

    if (error instanceof Error) {
      console.log('')
      console.log(error.message)
    }
  }

  console.log('')
  console.log(
    'Verificando que el INSERT haya sido revertido...'
  )
  console.log('')

  const verification =
    await readCatalogProductsByBarcodes([
      insertBarcode,
    ])

  const productSurvived =
    verification.productsByBarcode.has(
      insertBarcode
    )

  console.log(
    `Rollback activado:       ${
      rollbackTriggered ? 'Sí' : 'No'
    }`
  )

  console.log(
    `Producto temporal existe: ${
      productSurvived ? 'Sí ❌' : 'No ✅'
    }`
  )

  console.log('')

  if (
    rollbackTriggered &&
    !productSurvived
  ) {
    console.log('========================================')
    console.log('        ROLLBACK APROBADO ✅')
    console.log('========================================')
    console.log('')
    console.log(
      'PostgreSQL revirtió correctamente toda la transacción.'
    )
    console.log('')
    console.log(
      'ACE no dejó datos parciales en arcana_catalog.'
    )
    console.log('')
    return
  }

  console.error('========================================')
  console.error('        ROLLBACK FALLIDO ❌')
  console.error('========================================')
  console.error('')

  process.exitCode = 1
}

void run()