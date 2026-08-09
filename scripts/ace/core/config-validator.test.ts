import {
  ACE_CONFIG,
  type AceConfig,
} from '../config'

import {
  validateAceConfig,
} from './config-validator'

function cloneConfig(): AceConfig {
  return JSON.parse(
    JSON.stringify(
      ACE_CONFIG
    )
  ) as AceConfig
}

function run(): void {
  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    '       ACE CONFIG VALIDATION'
  )
  console.log(
    '========================================'
  )
  console.log('')

  const validResult =
    validateAceConfig()

  console.log(
    `Config actual válida: ${
      validResult.valid
        ? 'Sí ✅'
        : 'No ❌'
    }`
  )

  if (!validResult.valid) {
    console.log('')

    for (
      const issue
      of validResult.issues
    ) {
      console.log(
        `- ${issue.field}: ${issue.message}`
      )
    }

    process.exitCode = 1
    return
  }

  const brokenConfig =
    cloneConfig()

  brokenConfig.catalog.readBatchSize =
    0

  brokenConfig.enrichment.confidence =
    150

  brokenConfig.safety.transactionRequired =
    false

  const brokenResult =
    validateAceConfig(
      brokenConfig
    )

  console.log('')
  console.log(
    `Config inválida detectada: ${
      !brokenResult.valid
        ? 'Sí ✅'
        : 'No ❌'
    }`
  )

  console.log(
    `Errores detectados: ${brokenResult.issues.length}`
  )

  console.log('')

  for (
    const issue
    of brokenResult.issues
  ) {
    console.log(
      `- ${issue.field}`
    )
    console.log(
      `  ${issue.message}`
    )
  }

  console.log('')

  if (
    brokenResult.valid ||
    brokenResult.issues.length < 3
  ) {
    console.log(
      'CONFIG VALIDATION FALLIDO ❌'
    )

    process.exitCode = 1
    return
  }

  console.log(
    'CONFIG VALIDATION APROBADO ✅'
  )

  console.log('')
}

run()