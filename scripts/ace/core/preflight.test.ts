import {
  runPreflight,
  printPreflight,
} from './preflight'

function run(): void {
  console.log('')
  console.log(
    'PRUEBA 1: DRY RUN SEGURO'
  )

  const safeResult =
    runPreflight({
      filePath:
        'C:\\Users\\flor\\Desktop\\productos.csv',

      mode:
        'dry-run',

      plannedInserts:
        259,

      plannedUpdates:
        0,

      plannedKeeps:
        0,
    })

  printPreflight(
    safeResult
  )

  if (!safeResult.safe) {
    process.exitCode = 1
    return
  }

  console.log(
    'PRUEBA 2: ARCHIVO INEXISTENTE'
  )

  const brokenResult =
    runPreflight({
      filePath:
        'C:\\archivo-que-no-existe.csv',

      mode:
        'execute',

      plannedInserts:
        3,

      plannedUpdates:
        0,

      plannedKeeps:
        0,
    })

  printPreflight(
    brokenResult
  )

  if (brokenResult.safe) {
    console.log(
      'PRE-FLIGHT TEST FALLIDO ❌'
    )

    process.exitCode = 1
    return
  }

  console.log(
    'PRE-FLIGHT TEST APROBADO ✅'
  )
}

run()
