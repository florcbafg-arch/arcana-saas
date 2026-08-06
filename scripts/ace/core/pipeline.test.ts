import {
  runAcePipeline,
} from './pipeline'

async function run(): Promise<void> {
  try {
    const result =
      await runAcePipeline({
        filePath:
          'C:\\Users\\flor\\Desktop\\productos.csv',

        mode:
          'dry-run',

        /*
         * Para la primera prueba integral
         * NO consultaremos los 203 EAN a OFF.
         *
         * Primero validamos que todos los motores
         * se conecten correctamente.
         */
        enrich: false,
      })

    console.log('')
    console.log(
      '========================================'
    )
    console.log(
      '          ACE PIPELINE TEST'
    )
    console.log(
      '========================================'
    )
    console.log('')

    console.log(
      `Modo:                  ${result.mode}`
    )

    console.log(
      `Filas leídas:          ${result.rowsRead}`
    )

    console.log(
      `Productos únicos:      ${result.uniqueProducts}`
    )

    console.log(
      `Insertaría:            ${result.plannedInserts}`
    )

    console.log(
      `Actualizaría:          ${result.plannedUpdates}`
    )

    console.log(
      `Mantendría:            ${result.plannedKeeps}`
    )

    console.log(
      `Enriquecidos:          ${result.enrichedProducts}`
    )

    console.log(
      `Insertados reales:     ${result.inserted}`
    )

    console.log(
      `Actualizados reales:   ${result.updated}`
    )

    console.log(
      `Duración:              ${(result.durationMs / 1000).toFixed(2)}s`
    )

    console.log('')
    console.log(
      `Log: ${result.logFile}`
    )

    console.log('')
    console.log(
      'Supabase no fue modificado.'
    )
    console.log('')
    console.log(
      'PIPELINE INTEGRAL APROBADO ✅'
    )
    console.log('')

  } catch (error) {
    console.error('')
    console.error(
      'PIPELINE INTEGRAL FALLIDO ❌'
    )
    console.error('')

    if (error instanceof Error) {
      console.error(
        error.message
      )
    }

    process.exitCode = 1
  }
}

void run()