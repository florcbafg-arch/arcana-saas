import {
  ACE_CONFIG,
} from '../config'

function assert(
  condition: boolean,
  message: string
): void {
  if (!condition) {
    console.error(
      `FALLIDO ❌ ${message}`
    )

    process.exitCode = 1
    return
  }

  console.log(
    `APROBADO ✅ ${message}`
  )
}

function run(): void {
  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    '          ACE CONFIG ENGINE'
  )
  console.log(
    '========================================'
  )
  console.log('')

  console.log(
    `Versión:              ${ACE_CONFIG.version}`
  )

  console.log(
    `Modo por defecto:     ${ACE_CONFIG.defaults.mode}`
  )

  console.log(
    `País:                 ${ACE_CONFIG.defaults.country}`
  )

  console.log(
    `Batch Reader:         ${ACE_CONFIG.catalog.readBatchSize}`
  )

  console.log(
    `Batch Writer:         ${ACE_CONFIG.catalog.writeBatchSize}`
  )

  console.log(
    `Open Food Facts:      ${
      ACE_CONFIG.enrichment.enabled
        ? 'ON'
        : 'OFF'
    }`
  )

  console.log(
    `Delay OFF:            ${ACE_CONFIG.enrichment.requestDelayMs}ms`
  )

  console.log(
    `Transacciones:        ${
      ACE_CONFIG.safety.transactionRequired
        ? 'OBLIGATORIAS'
        : 'OPCIONALES'
    }`
  )

  console.log('')

  assert(
    ACE_CONFIG.defaults.mode ===
      'dry-run',
    'ACE inicia siempre en modo seguro.'
  )

  assert(
    ACE_CONFIG.catalog.readBatchSize >
      0,
    'Reader tiene batch válido.'
  )

  assert(
    ACE_CONFIG.catalog.writeBatchSize >
      0,
    'Writer tiene batch válido.'
  )

  assert(
    ACE_CONFIG.enrichment.requestDelayMs >=
      0,
    'Delay de enriquecimiento válido.'
  )

  assert(
    ACE_CONFIG.safety.requireExplicitExecute ===
      true,
    'La escritura real requiere ejecución explícita.'
  )

  assert(
    ACE_CONFIG.safety.transactionRequired ===
      true,
    'Las operaciones reales requieren Transaction Engine.'
  )

  console.log('')

  if (!process.exitCode) {
    console.log(
      'CONFIG ENGINE APROBADO ✅'
    )
  }

  console.log('')
}

run()