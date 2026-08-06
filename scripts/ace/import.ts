import path from 'node:path'
import process from 'node:process'

import { readEaxaFile } from './adapters/eaxa'
import { prepareCatalogImport } from './core/importer'
import { inspectCatalogDataset } from './core/inspector'
import {
  printDatasetInspection,
  printImportReport,
} from './core/report'

function getFilePath(): string {
  const fileArgument = process.argv[2]

  if (!fileArgument) {
    throw new Error(
      [
        'No se indicó el archivo que querés analizar.',
        '',
        'Ejemplo:',
        'npm run ace:analyze -- "C:\\ruta\\productos.xlsx"',
      ].join('\n')
    )
  }

  return path.resolve(fileArgument)
}

function run(): void {
  try {
    const filePath = getFilePath()

    console.log('')
    console.log('ACE está leyendo el archivo...')
    console.log(`Archivo: ${filePath}`)
    console.log('')

    const adapterResult = readEaxaFile(filePath)

    console.log('Lectura del archivo terminada.')
    console.log(`Filas encontradas: ${adapterResult.totalRows}`)
    console.log(`Filas vacías: ${adapterResult.emptyRows}`)
    console.log(
      `Filas con estructura incorrecta: ${adapterResult.malformedRows}`
    )
    console.log('')

    const preparedImport = prepareCatalogImport(
      adapterResult.products
    )

    printImportReport(preparedImport)
    
    const inspection = inspectCatalogDataset(
  preparedImport.products
)

printDatasetInspection(inspection)

    console.log('Resumen del adaptador EAXA:')
    console.log('----------------------------------------')
    console.log(
      `Productos enviados al análisis: ${adapterResult.products.length}`
    )
    console.log(
      `Filas vacías descartadas:       ${adapterResult.emptyRows}`
    )
    console.log(
      `Filas mal formadas descartadas: ${adapterResult.malformedRows}`
    )
    console.log('')

    console.log(
      'Prueba finalizada correctamente. Ningún dato fue enviado a Supabase.'
    )
    console.log('')
  } catch (error) {
    console.error('')
    console.error('ACE no pudo analizar el archivo.')
    console.error('')

    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error('Ocurrió un error desconocido.')
    }

    console.error('')
    process.exitCode = 1
  }
}

run()