import {
  ACE_CONFIG,
  type AceConfig,
} from '../config'

export type ConfigValidationIssue = {
  field: string
  message: string
}

export type ConfigValidationResult = {
  valid: boolean
  issues: ConfigValidationIssue[]
}

export function validateAceConfig(
  config: AceConfig = ACE_CONFIG
): ConfigValidationResult {
  const issues: ConfigValidationIssue[] = []

  if (!config.version.trim()) {
    issues.push({
      field: 'version',
      message:
        'La versión de ACE no puede estar vacía.',
    })
  }

  if (
    config.defaults.mode !== 'dry-run' &&
    config.defaults.mode !== 'execute'
  ) {
    issues.push({
      field: 'defaults.mode',
      message:
        'El modo por defecto debe ser dry-run o execute.',
    })
  }

  if (!config.defaults.country.trim()) {
    issues.push({
      field: 'defaults.country',
      message:
        'El país por defecto no puede estar vacío.',
    })
  }

  if (!config.defaults.language.trim()) {
    issues.push({
      field: 'defaults.language',
      message:
        'El idioma por defecto no puede estar vacío.',
    })
  }

  if (
    !Number.isFinite(
      config.catalog.readBatchSize
    ) ||
    config.catalog.readBatchSize <= 0
  ) {
    issues.push({
      field:
        'catalog.readBatchSize',
      message:
        'El batch del Reader debe ser mayor que 0.',
    })
  }

  if (
    !Number.isFinite(
      config.catalog.writeBatchSize
    ) ||
    config.catalog.writeBatchSize <= 0
  ) {
    issues.push({
      field:
        'catalog.writeBatchSize',
      message:
        'El batch del Writer debe ser mayor que 0.',
    })
  }

  if (
    config.catalog.confidenceDefault < 0 ||
    config.catalog.confidenceDefault > 100
  ) {
    issues.push({
      field:
        'catalog.confidenceDefault',
      message:
        'La confianza por defecto debe estar entre 0 y 100.',
    })
  }

  if (
    config.enrichment.requestDelayMs < 0
  ) {
    issues.push({
      field:
        'enrichment.requestDelayMs',
      message:
        'El delay de enriquecimiento no puede ser negativo.',
    })
  }

  if (
    config.enrichment.confidence < 0 ||
    config.enrichment.confidence > 100
  ) {
    issues.push({
      field:
        'enrichment.confidence',
      message:
        'La confianza de enriquecimiento debe estar entre 0 y 100.',
    })
  }

  if (
    !config.logs.directory.trim()
  ) {
    issues.push({
      field:
        'logs.directory',
      message:
        'El directorio de logs no puede estar vacío.',
    })
  }

  if (
    !config.reports.directory.trim()
  ) {
    issues.push({
      field:
        'reports.directory',
      message:
        'El directorio de reportes no puede estar vacío.',
    })
  }

  if (
    config.safety.transactionRequired !== true
  ) {
    issues.push({
      field:
        'safety.transactionRequired',
      message:
        'Las operaciones reales deben usar Transaction Engine.',
    })
  }

  if (
    config.safety.requireExplicitExecute !== true
  ) {
    issues.push({
      field:
        'safety.requireExplicitExecute',
      message:
        'Execute debe requerir activación explícita.',
    })
  }

  return {
    valid:
      issues.length === 0,

    issues,
  }
}

export function assertAceConfigValid(
  config: AceConfig = ACE_CONFIG
): void {
  const validation =
    validateAceConfig(config)

  if (validation.valid) {
    return
  }

  const details =
    validation.issues
      .map(
        (issue) =>
          `- ${issue.field}: ${issue.message}`
      )
      .join('\n')

  throw new Error(
    [
      'ACE CONFIG INVALIDA.',
      '',
      details,
    ].join('\n')
  )
}