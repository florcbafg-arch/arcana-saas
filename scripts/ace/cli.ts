import path from 'node:path'
import fs from 'node:fs'

import {
  ACE_CONFIG,
  type AceMode,
} from './config'

import {
  runAcePipeline,
} from './core/pipeline'

import {
  buildAceFinalReport,
  printAceFinalReport,
  saveAceFinalReport,
} from './core/final-report'

import {
  printCommandSummary,
} from './core/summary'
import {
  assertAceConfigValid,
} from './core/config-validator'
import {
  runPreflight,
  printPreflight,
  assertPreflightSafe,
} from './core/preflight'

type CliOptions = {
  filePath: string | null
  mode: AceMode
  enrich: boolean
  help: boolean
  confirmExecute: boolean
}

async function main(): Promise<void> {
  try {
        assertAceConfigValid()

    const options =
      parseArguments(
        process.argv.slice(2)
      )

    if (options.help) {
      printHelp()
      return
    }

    if (!options.filePath) {
      console.error('')
      console.error(
        'Falta indicar el archivo a procesar.'
      )
      console.error('')
      printHelp()

      process.exitCode = 1
      return
    }

    const resolvedFilePath =
      path.resolve(
        options.filePath
      )

    if (
      !fs.existsSync(
        resolvedFilePath
      )
    ) {
      throw new Error(
        `El archivo no existe: ${resolvedFilePath}`
      )
    }

    const preflight =
  runPreflight({
    filePath:
      resolvedFilePath,

    mode:
      options.mode,
  })

printPreflight(
  preflight
)

assertPreflightSafe({
  filePath:
    resolvedFilePath,

  mode:
    options.mode,
})

   /*
 * Barrera de seguridad:
 *
 * --execute NO alcanza por sí solo.
 * También debe existir --confirm-execute.
 */
if (
  options.mode === 'execute' &&
  ACE_CONFIG.safety.requireExplicitExecute &&
  !options.confirmExecute
) {
  throw new Error(
    [
      'ACE BLOQUEÓ LA EJECUCIÓN REAL.',
      '',
      'Se solicitó --execute, pero falta la confirmación explícita.',
      '',
      'Para ejecutar cambios reales agregá:',
      '--confirm-execute',
    ].join('\n')
  )
}

if (
  options.mode === 'execute'
) {
  console.log('')
  console.log(
    '⚠ ACE ejecutará cambios REALES en arcana_catalog.'
  )
  console.log('')
}

printHeader(
  resolvedFilePath,
  options
)

  const pipeline =
  await runAcePipeline({
    filePath: resolvedFilePath,
    mode: options.mode,
    enrich: options.enrich,
  })

    const status =
      options.mode === 'dry-run'
        ? 'dry-run'
        : 'success'

    const report =
      buildAceFinalReport({
        filePath:
          resolvedFilePath,

        pipeline,

        status,
      })

    printAceFinalReport(
      report
    )

    if (
      ACE_CONFIG.reports.enabled &&
      ACE_CONFIG.reports.saveJson
    ) {
      const reportPath =
        saveAceFinalReport(
          report
        )

      console.log('')
      console.log(
        `Reporte guardado: ${reportPath}`
      )
    }

    console.log('')
    console.log(
      'ACE finalizó correctamente ✅'
    )
    console.log('')

  } catch (error) {
    console.error('')
    console.error(
      'ACE terminó con error ❌'
    )
    console.error('')

    if (
      error instanceof Error
    ) {
      console.error(
        error.message
      )
    } else {
      console.error(
        'Error desconocido.'
      )
    }

    process.exitCode = 1
  }
}

function parseArguments(
  args: string[]
): CliOptions {
  let filePath: string | null =
    null

  let mode: AceMode =
    ACE_CONFIG.defaults.mode

  let enrich =
    ACE_CONFIG.enrichment.enabled

  let help = false

  let confirmExecute = false

  for (
    let index = 0;
    index < args.length;
    index += 1
  ) {
    const argument =
      args[index]

    if (
      argument === '--help' ||
      argument === '-h'
    ) {
      help = true
      continue
    }

    if (
  argument === '--confirm-execute'
) {
  confirmExecute = true
  continue
}

    if (
      argument === '--execute'
    ) {
      mode = 'execute'
      continue
    }

    if (
      argument === '--dry-run'
    ) {
      mode = 'dry-run'
      continue
    }

    if (
      argument === '--no-enrich'
    ) {
      enrich = false
      continue
    }

    if (
      argument === '--enrich'
    ) {
      enrich = true
      continue
    }

    if (
      argument === '--file'
    ) {
      const nextValue =
        args[index + 1]

      if (!nextValue) {
        throw new Error(
          'Falta el valor después de --file.'
        )
      }

      filePath =
        nextValue

      index += 1
      continue
    }

    if (
      argument.startsWith(
        '--file='
      )
    ) {
      filePath =
        argument.slice(
          '--file='.length
        )

      continue
    }

    /*
     * Permitimos también:
     *
     * npm run ace -- productos.csv
     */
    if (
      !argument.startsWith('--') &&
      !filePath
    ) {
      filePath =
        argument
    }
  }

  return {
  filePath,
  mode,
  enrich,
  help,
  confirmExecute,
}
}

function printHeader(
  filePath: string,
  options: CliOptions
): void {
  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    `      ARCANA CATALOG ENGINE v${ACE_CONFIG.version}`
  )
  console.log(
    '========================================'
  )
  console.log('')

  console.log(
    `Archivo:         ${path.basename(filePath)}`
  )

  console.log(
    `Modo:            ${options.mode}`
  )

  console.log(
    `Enriquecimiento: ${
      options.enrich
        ? 'ON'
        : 'OFF'
    }`
  )

  console.log('')
}

function printHelp(): void {
  console.log('')
  console.log(
    `Arcana Catalog Engine v${ACE_CONFIG.version}`
  )

  console.log('')
  console.log('Uso:')
  console.log('')

  console.log(
    'npm run ace -- <archivo>'
  )

  console.log('')
  console.log('Opciones:')
  console.log('')

  console.log(
    '--dry-run      Simula la sincronización. Es el modo por defecto.'
  )

  console.log(
    '--execute      Ejecuta cambios reales mediante Transaction Engine.'
  )

  console.log(
  '--confirm-execute  Confirma explícitamente la ejecución real.'
)

  console.log(
    '--enrich       Activa Open Food Facts.'
  )

  console.log(
    '--no-enrich    Omite enriquecimiento.'
  )

  console.log(
    '--file <ruta>  Indica explícitamente el archivo.'
  )

  console.log(
    '--help, -h     Muestra esta ayuda.'
  )

  console.log('')
  console.log('Ejemplos:')
  console.log('')

  console.log(
    'npm run ace -- "C:\\Users\\flor\\Desktop\\productos.csv"'
  )

  console.log(
    'npm run ace -- "C:\\Users\\flor\\Desktop\\productos.csv" --no-enrich'
  )

 console.log(
  'npm run ace -- "C:\\Users\\flor\\Desktop\\productos.csv" --execute --confirm-execute'
)

  console.log('')
}

void main()