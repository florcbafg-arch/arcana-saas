import fs from 'node:fs'

import {
  ACE_CONFIG,
  type AceMode,
} from '../config'

import {
  validateAceConfig,
} from './config-validator'

export type PreflightInput = {
  filePath: string
  mode: AceMode
  plannedInserts?: number
  plannedUpdates?: number
  plannedKeeps?: number
}

export type PreflightCheck = {
  name: string
  passed: boolean
  message: string
}

export type PreflightResult = {
  safe: boolean
  checks: PreflightCheck[]
}

export function runPreflight(
  input: PreflightInput
): PreflightResult {
  const checks: PreflightCheck[] = []

  const configValidation =
    validateAceConfig()

  checks.push({
    name: 'Configuración',
    passed:
      configValidation.valid,
    message:
      configValidation.valid
        ? 'ACE_CONFIG válida.'
        : 'ACE_CONFIG contiene errores.',
  })

  const fileExists =
    fs.existsSync(
      input.filePath
    )

  checks.push({
    name: 'Archivo',
    passed:
      fileExists,
    message:
      fileExists
        ? 'Archivo accesible.'
        : 'El archivo no existe.',
  })

  checks.push({
    name: 'Modo',
    passed:
      input.mode === 'dry-run' ||
      input.mode === 'execute',
    message:
      `Modo solicitado: ${input.mode}`,
  })

  if (
    input.mode === 'execute'
  ) {
    checks.push({
      name:
        'Execute explícito',

      passed:
        ACE_CONFIG
          .safety
          .requireExplicitExecute ===
        true,

      message:
        ACE_CONFIG
          .safety
          .requireExplicitExecute
          ? 'Execute requiere activación explícita.'
          : 'Execute no está protegido.',
    })

    checks.push({
      name:
        'Transaction Engine',

      passed:
        ACE_CONFIG
          .safety
          .transactionRequired ===
        true,

      message:
        ACE_CONFIG
          .safety
          .transactionRequired
          ? 'Transaction Engine obligatorio.'
          : 'La escritura podría ejecutarse sin transacción.',
    })
  }

  const totalChanges =
    (input.plannedInserts ?? 0) +
    (input.plannedUpdates ?? 0)

  checks.push({
    name:
      'Plan de cambios',

    passed:
      totalChanges >= 0,

    message:
      `${totalChanges} cambios planificados.`,
  })

  const safe =
    checks.every(
      (check) =>
        check.passed
    )

  return {
    safe,
    checks,
  }
}

export function assertPreflightSafe(
  input: PreflightInput
): void {
  const result =
    runPreflight(
      input
    )

  if (result.safe) {
    return
  }

  const details =
    result.checks
      .filter(
        (check) =>
          !check.passed
      )
      .map(
        (check) =>
          `- ${check.name}: ${check.message}`
      )
      .join('\n')

  throw new Error(
    [
      'ACE PREFLIGHT FALLIDO.',
      '',
      details,
    ].join('\n')
  )
}

export function printPreflight(
  result: PreflightResult
): void {
  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    '          ACE PREFLIGHT'
  )
  console.log(
    '========================================'
  )
  console.log('')

  for (
    const check
    of result.checks
  ) {
    console.log(
      `${
        check.passed
          ? '✅'
          : '❌'
      } ${check.name}: ${check.message}`
    )
  }

  console.log('')

  console.log(
    result.safe
      ? 'PREFLIGHT APROBADO ✅'
      : 'PREFLIGHT BLOQUEADO ❌'
  )

  console.log('')
}