import {
  compareMeasurements,
} from './measurement'

function test(
  title: string,
  quantityA: string,
  unitA: string,
  quantityB: string,
  unitB: string,
  expected: boolean
): void {
  const result =
    compareMeasurements(
      quantityA,
      unitA,
      quantityB,
      unitB
    )

  const passed =
    result.equivalent === expected

  console.log('')
  console.log(title)
  console.log(
    '----------------------------------------'
  )

  console.log(
    `${quantityA} ${unitA}`
  )

  console.log('VS')

  console.log(
    `${quantityB} ${unitB}`
  )

  console.log('')

  console.log(
    `Equivalentes: ${
      result.equivalent
        ? 'Sí'
        : 'No'
    }`
  )

  console.log(
    `Resultado: ${
      passed
        ? 'APROBADO ✅'
        : 'FALLIDO ❌'
    }`
  )

  if (!passed) {
    process.exitCode = 1
  }
}

console.log('')
console.log(
  '========================================'
)
console.log(
  '       ACE MEASUREMENT ENGINE'
)
console.log(
  '========================================'
)

test(
  'PRUEBA 1',
  '2,5 L',
  'litro',
  '2500',
  'ml',
  true
)

test(
  'PRUEBA 2',
  '1',
  'kg',
  '1000',
  'g',
  true
)

test(
  'PRUEBA 3',
  '500 g',
  'g',
  '0,5',
  'kg',
  true
)

test(
  'PRUEBA 4',
  '1',
  'litro',
  '500',
  'ml',
  false
)

test(
  'PRUEBA 5',
  '3',
  'unidad',
  '3',
  'unidad',
  true
)

console.log('')