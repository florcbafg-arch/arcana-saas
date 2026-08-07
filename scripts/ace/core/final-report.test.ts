import fs from 'node:fs'

import {
  runAcePipeline,
} from './pipeline'

import {
  buildAceFinalReport,
  printAceFinalReport,
  saveAceFinalReport,
} from './final-report'

async function run(): Promise<void> {
  try {
    const filePath =
      'C:\\Users\\flor\\Desktop\\productos.csv'

    const pipeline =
      await runAcePipeline({
        filePath,
        mode: 'dry-run',
        enrich: false,
      })

    const report =
      buildAceFinalReport({
        filePath,

        pipeline,

        status:
          'dry-run',
      })

    printAceFinalReport(
      report
    )

    const reportPath =
      saveAceFinalReport(
        report,
        'ace-test-report'
      )

    const exists =
      fs.existsSync(
        reportPath
      )

    console.log('')
    console.log(
      `Reporte JSON creado: ${
        exists
          ? 'Sí ✅'
          : 'No ❌'
      }`
    )

    console.log(
      `Ubicación: ${reportPath}`
    )

    console.log('')

    if (!exists) {
      process.exitCode = 1
      return
    }

    console.log(
      'FINAL REPORT ENGINE APROBADO ✅'
    )

    console.log('')

  } catch (error) {
    console.error('')
    console.error(
      'FINAL REPORT ENGINE FALLIDO ❌'
    )
    console.error('')

    if (
      error instanceof Error
    ) {
      console.error(
        error.message
      )
    }

    process.exitCode = 1
  }
}

void run()