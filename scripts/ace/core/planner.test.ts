import { readEaxaFile } from '../adapters/eaxa'
import { prepareCatalogImport } from './importer'
import { readCatalogProductsByBarcodes } from './supabase-reader'
import { createCatalogSyncPlan } from './planner'

async function run(): Promise<void> {
  try {
    const filePath =
      'C:\\Users\\flor\\Desktop\\productos.csv'

    console.log('')
    console.log('ACE está preparando el plan de sincronización...')
    console.log('')

    const adapterResult = readEaxaFile(filePath)

    const preparedImport = prepareCatalogImport(
      adapterResult.products
    )

    const barcodes = preparedImport.products.map(
      (product) => product.barcode
    )

    const catalogResult =
      await readCatalogProductsByBarcodes(barcodes)

    const plan = createCatalogSyncPlan(
      preparedImport.products,
      catalogResult.productsByBarcode
    )

    console.log('========================================')
    console.log('              ACE PLANNER')
    console.log('        PLAN DE SINCRONIZACIÓN')
    console.log('========================================')
    console.log('')

    console.log(`Productos analizados: ${plan.total}`)
    console.log(`Insertar:              ${plan.inserts.length}`)
    console.log(`Actualizar:            ${plan.updates.length}`)
    console.log(`Mantener:              ${plan.keeps.length}`)
    console.log('')

    printPlanSection(
      'Primeros productos para INSERTAR',
      plan.inserts
    )

    printPlanSection(
      'Primeros productos para ACTUALIZAR',
      plan.updates
    )

    printPlanSection(
      'Primeros productos para MANTENER',
      plan.keeps
    )

    console.log('========================================')
    console.log('Modo simulación.')
    console.log('Supabase no fue modificado.')
    console.log('========================================')
    console.log('')
  } catch (error) {
    console.error('')
    console.error('La prueba del Planner falló.')
    console.error('')

    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error('Ocurrió un error desconocido.')
    }

    process.exitCode = 1
  }
}

function printPlanSection(
  title: string,
  items: Array<{
    barcode: string
    finalProduct: {
      name: string
    }
    reasons: string[]
  }>
): void {
  console.log(title)
  console.log('----------------------------------------')

  if (items.length === 0) {
    console.log('Sin productos.')
    console.log('')
    return
  }

  items.slice(0, 10).forEach((item) => {
    console.log(
      `${item.barcode} | ${item.finalProduct.name}`
    )

    item.reasons.forEach((reason) => {
      console.log(`- ${reason}`)
    })

    console.log('')
  })

  if (items.length > 10) {
    console.log(`... y ${items.length - 10} más`)
    console.log('')
  }
}

void run()