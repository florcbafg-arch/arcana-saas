import fs from 'node:fs'

import {
  AceLogger,
} from './logger'

function run(): void {
  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    '          ACE LOGGER ENGINE'
  )
  console.log(
    '========================================'
  )
  console.log('')

  const logger =
    new AceLogger(
      'ace-test'
    )

  logger.info(
    'ACE inició una ejecución.'
  )

  logger.info(
    'Dataset analizado.',
    {
      products: 259,
      duplicates: 8796,
    }
  )

  logger.success(
    'Planner completado.',
    {
      inserts: 259,
      updates: 0,
      keeps: 0,
    }
  )

  logger.warning(
    'Producto no encontrado en Open Food Facts.',
    {
      barcode:
        '9999999999999',
    }
  )

  logger.error(
    'Error simulado para validar Logger.',
    {
      stage:
        'test',
    }
  )

  const filePath =
    logger.getFilePath()

  const exists =
    fs.existsSync(
      filePath
    )

  console.log(
    `Archivo creado: ${
      exists
        ? 'Sí ✅'
        : 'No ❌'
    }`
  )

  console.log('')

  console.log(
    `Ubicación: ${filePath}`
  )

  console.log('')

  if (!exists) {
    process.exitCode = 1
    return
  }

  const content =
    fs.readFileSync(
      filePath,
      'utf8'
    )

  const lines =
    content
      .split(/\r?\n/)
      .filter(Boolean)

  console.log(
    `Eventos registrados: ${lines.length}`
  )

  console.log('')

  if (lines.length === 5) {
    console.log(
      'LOGGER ENGINE APROBADO ✅'
    )
  } else {
    console.log(
      'LOGGER ENGINE FALLIDO ❌'
    )

    process.exitCode = 1
  }

  console.log('')
}

run()