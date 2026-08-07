import path from 'node:path'

import type {
  PipelineResult,
} from './pipeline'

export type CommandSummaryInput = {
  filePath: string
  pipeline: PipelineResult
  reportPath?: string | null
}

export function printCommandSummary(
  input: CommandSummaryInput
): void {
  const {
    filePath,
    pipeline,
    reportPath,
  } = input

  const status =
    pipeline.mode === 'dry-run'
      ? 'SIMULACIÓN COMPLETADA ✅'
      : 'SINCRONIZACIÓN COMPLETADA ✅'

  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    '              ACE FINAL'
  )
  console.log(
    '========================================'
  )
  console.log('')

  console.log(
    `Archivo........ ${path.basename(filePath)}`
  )

  console.log(
    `Modo........... ${formatMode(pipeline.mode)}`
  )

  console.log('')

  console.log(
    `Filas.......... ${pipeline.rowsRead}`
  )

  console.log(
    `Únicos......... ${pipeline.uniqueProducts}`
  )

  console.log('')

  console.log(
    `Insertar....... ${pipeline.plannedInserts}`
  )

  console.log(
    `Actualizar..... ${pipeline.plannedUpdates}`
  )

  console.log(
    `Mantener....... ${pipeline.plannedKeeps}`
  )

  console.log('')

  console.log(
    `Enriquecidos... ${pipeline.enrichedProducts}`
  )

  console.log('')

  console.log(
    `Insertados..... ${pipeline.inserted}`
  )

  console.log(
    `Actualizados... ${pipeline.updated}`
  )

  console.log('')

  console.log(
    `Duración....... ${(pipeline.durationMs / 1000).toFixed(2)}s`
  )

  console.log('')

  if (reportPath) {
    console.log(
      `Reporte........ ${reportPath}`
    )
  }

  console.log(
    `Log............ ${pipeline.logFile}`
  )

  console.log('')
  console.log(
    `Estado......... ${status}`
  )

  console.log('')
  console.log(
    '========================================'
  )
  console.log('')
}

function formatMode(
  mode: PipelineResult['mode']
): string {
  if (mode === 'dry-run') {
    return 'Dry Run'
  }

  return 'Execute'
}