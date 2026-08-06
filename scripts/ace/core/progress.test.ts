import {
  AceProgress,
  printProgress,
} from './progress'

async function wait(
  milliseconds: number
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      )
    }
  )
}

async function run(): Promise<void> {
  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    '         ACE PROGRESS ENGINE'
  )
  console.log(
    '========================================'
  )
  console.log('')

  const progress =
    new AceProgress(
      printProgress
    )

  progress.startStage(
    'reading',
    10,
    'Leyendo catálogo...'
  )

  for (
    let index = 1;
    index <= 10;
    index += 1
  ) {
    await wait(80)

    progress.update(
      index,
      `Leyendo producto ${index} de 10`
    )
  }

  progress.startStage(
    'enriching',
    5,
    'Consultando Open Food Facts...'
  )

  for (
    let index = 1;
    index <= 5;
    index += 1
  ) {
    await wait(100)

    progress.update(
      index,
      `Enriqueciendo producto ${index} de 5`
    )
  }

  progress.startStage(
    'writing',
    3,
    'Aplicando cambios...'
  )

  for (
    let index = 1;
    index <= 3;
    index += 1
  ) {
    await wait(100)

    progress.update(
      index,
      `Aplicando cambio ${index} de 3`
    )
  }

  progress.complete(
    'Pipeline completado.'
  )

  console.log('')
}

void run()