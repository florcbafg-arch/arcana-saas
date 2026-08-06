import {
  readCatalogProductsByBarcodes,
} from './supabase-reader'

async function run(): Promise<void> {
  try {
    console.log('')
    console.log('ACE está consultando Supabase...')
    console.log('')

    const result =
      await readCatalogProductsByBarcodes([
        '7791813434412',
        '0000000023897',
        '9999999999999',
      ])

    console.log('========================================')
    console.log('      SUPABASE READER TEST')
    console.log('========================================')
    console.log('')

    console.log(
      `Códigos solicitados: ${result.requestedBarcodes}`
    )
    console.log(
      `Productos encontrados: ${result.foundProducts}`
    )
    console.log(
      `Productos faltantes: ${result.missingProducts}`
    )
    console.log('')

    for (const [
      barcode,
      product,
    ] of result.productsByBarcode.entries()) {
      console.log(`Código: ${barcode}`)
      console.log(`Producto: ${product.name}`)
      console.log(`Fuente: ${product.source}`)
      console.log('----------------------------------------')
    }

    console.log('')
    console.log(
      'Prueba finalizada. Supabase no fue modificado.'
    )
    console.log('')
  } catch (error) {
    console.error('')
    console.error('La prueba del Supabase Reader falló.')
    console.error('')

    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error('Error desconocido.')
    }

    process.exitCode = 1
  }
}

void run()