import fs from 'node:fs'
import path from 'node:path'

import type {
  PipelineResult,
} from './pipeline'

export type AceFinalReportInput = {
  filePath: string
  pipeline: PipelineResult

  dataset?: {
    totalRows?: number
    emptyRows?: number
    malformedRows?: number
    duplicates?: number
    invalid?: number
    healthScore?: number
    healthLabel?: string
  }

  enrichment?: {
    eligible?: number
    found?: number
    notFound?: number
    improved?: number
    unchanged?: number
    failed?: number
  }

  status:
    | 'success'
    | 'dry-run'
    | 'failed'

  error?: string | null
}

export type AceFinalReport = {
  generatedAt: string

  source: {
    file: string
    fileName: string
  }

  execution: {
    mode: string
    status:
      | 'success'
      | 'dry-run'
      | 'failed'

    durationMs: number
    durationSeconds: number
  }

  dataset: {
    rowsRead: number
    uniqueProducts: number

    emptyRows: number
    malformedRows: number
    duplicates: number
    invalid: number

    healthScore: number | null
    healthLabel: string | null
  }

  synchronization: {
    plannedInserts: number
    plannedUpdates: number
    plannedKeeps: number

    inserted: number
    updated: number
    kept: number
  }

  enrichment: {
    enrichedProducts: number

    eligible: number
    found: number
    notFound: number
    improved: number
    unchanged: number
    failed: number
  }

  logs: {
    logFile: string
  }

  error: string | null
}

/**
 * Construye el reporte final sin modificar
 * ninguna fuente de datos.
 */
export function buildAceFinalReport(
  input: AceFinalReportInput
): AceFinalReport {
  const {
    filePath,
    pipeline,
  } = input

  return {
    generatedAt:
      new Date().toISOString(),

    source: {
      file: filePath,

      fileName:
        path.basename(
          filePath
        ),
    },

    execution: {
      mode:
        pipeline.mode,

      status:
        input.status,

      durationMs:
        pipeline.durationMs,

      durationSeconds:
        round(
          pipeline.durationMs /
          1000
        ),
    },

    dataset: {
      rowsRead:
        pipeline.rowsRead,

      uniqueProducts:
        pipeline.uniqueProducts,

      emptyRows:
        input.dataset?.emptyRows ??
        0,

      malformedRows:
        input.dataset?.malformedRows ??
        0,

      duplicates:
        input.dataset?.duplicates ??
        0,

      invalid:
        input.dataset?.invalid ??
        0,

      healthScore:
        input.dataset?.healthScore ??
        null,

      healthLabel:
        input.dataset?.healthLabel ??
        null,
    },

    synchronization: {
      plannedInserts:
        pipeline.plannedInserts,

      plannedUpdates:
        pipeline.plannedUpdates,

      plannedKeeps:
        pipeline.plannedKeeps,

      inserted:
        pipeline.inserted,

      updated:
        pipeline.updated,

      kept:
        pipeline.kept,
    },

    enrichment: {
      enrichedProducts:
        pipeline.enrichedProducts,

      eligible:
        input.enrichment?.eligible ??
        0,

      found:
        input.enrichment?.found ??
        0,

      notFound:
        input.enrichment?.notFound ??
        0,

      improved:
        input.enrichment?.improved ??
        pipeline.enrichedProducts,

      unchanged:
        input.enrichment?.unchanged ??
        0,

      failed:
        input.enrichment?.failed ??
        0,
    },

    logs: {
      logFile:
        pipeline.logFile,
    },

    error:
      input.error ?? null,
  }
}

/**
 * Imprime una versión humana del reporte.
 */
export function printAceFinalReport(
  report: AceFinalReport
): void {
  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    '          ACE FINAL REPORT'
  )
  console.log(
    '========================================'
  )
  console.log('')

  console.log(
    `Archivo:              ${report.source.fileName}`
  )

  console.log(
    `Modo:                 ${report.execution.mode}`
  )

  console.log(
    `Estado:               ${formatStatus(report.execution.status)}`
  )

  console.log('')

  console.log('DATASET')
  console.log(
    '----------------------------------------'
  )

  console.log(
    `Filas leídas:         ${report.dataset.rowsRead}`
  )

  console.log(
    `Productos únicos:     ${report.dataset.uniqueProducts}`
  )

  console.log(
    `Duplicados:           ${report.dataset.duplicates}`
  )

  console.log(
    `Inválidos:            ${report.dataset.invalid}`
  )

  console.log(
    `Filas vacías:         ${report.dataset.emptyRows}`
  )

  console.log(
    `Mal formadas:         ${report.dataset.malformedRows}`
  )

  if (
    report.dataset.healthScore !==
    null
  ) {
    console.log(
      `Dataset Score:        ${report.dataset.healthScore}/100`
    )
  }

  if (
    report.dataset.healthLabel
  ) {
    console.log(
      `Calidad:              ${report.dataset.healthLabel}`
    )
  }

  console.log('')
  console.log('SINCRONIZACIÓN')
  console.log(
    '----------------------------------------'
  )

  console.log(
    `Plan INSERT:          ${report.synchronization.plannedInserts}`
  )

  console.log(
    `Plan UPDATE:          ${report.synchronization.plannedUpdates}`
  )

  console.log(
    `Plan KEEP:            ${report.synchronization.plannedKeeps}`
  )

  console.log('')

  console.log(
    `Insertados reales:    ${report.synchronization.inserted}`
  )

  console.log(
    `Actualizados reales:  ${report.synchronization.updated}`
  )

  console.log(
    `Sin cambios:          ${report.synchronization.kept}`
  )

  console.log('')
  console.log('ENRIQUECIMIENTO')
  console.log(
    '----------------------------------------'
  )

  console.log(
    `Productos mejorados:  ${report.enrichment.enrichedProducts}`
  )

  console.log(
    `Aptos para OFF:       ${report.enrichment.eligible}`
  )

  console.log(
    `Encontrados en OFF:   ${report.enrichment.found}`
  )

  console.log(
    `No encontrados:       ${report.enrichment.notFound}`
  )

  console.log(
    `Errores OFF:          ${report.enrichment.failed}`
  )

  console.log('')
  console.log('EJECUCIÓN')
  console.log(
    '----------------------------------------'
  )

  console.log(
    `Duración:             ${report.execution.durationSeconds}s`
  )

  console.log(
    `Log técnico:          ${report.logs.logFile}`
  )

  if (report.error) {
    console.log('')
    console.log(
      `Error: ${report.error}`
    )
  }

  console.log('')
  console.log(
    '========================================'
  )
}

/**
 * Guarda el mismo reporte en JSON.
 */
export function saveAceFinalReport(
  report: AceFinalReport,
  filePrefix = 'ace-report'
): string {
  const directory =
    path.resolve(
      process.cwd(),
      'reports',
      'ace'
    )

  fs.mkdirSync(
    directory,
    {
      recursive: true,
    }
  )

  const timestamp =
    new Date()
      .toISOString()
      .replace(/[:.]/g, '-')

  const filePath =
    path.join(
      directory,
      `${filePrefix}-${timestamp}.json`
    )

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      report,
      null,
      2
    ),
    'utf8'
  )

  return filePath
}

function formatStatus(
  status:
    | 'success'
    | 'dry-run'
    | 'failed'
): string {
  if (status === 'success') {
    return 'SUCCESS ✅'
  }

  if (status === 'dry-run') {
    return 'DRY RUN ✅'
  }

  return 'FAILED ❌'
}

function round(
  value: number
): number {
  return (
    Math.round(
      value * 100
    ) / 100
  )
}