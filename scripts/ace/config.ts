export type AceMode =
  | 'dry-run'
  | 'execute'

export type AceLogLevel =
  | 'info'
  | 'warning'
  | 'error'

export type AceConfig = {
  version: string

  defaults: {
    country: string
    language: string
    mode: AceMode
  }

  catalog: {
    readBatchSize: number
    writeBatchSize: number
    confidenceDefault: number
    globalByDefault: boolean
  }

  enrichment: {
    enabled: boolean
    provider: 'openfoodfacts'
    requestDelayMs: number
    confidence: number
  }

  progress: {
    enabled: boolean
  }

  logs: {
    enabled: boolean
    level: AceLogLevel
    directory: string
  }

  reports: {
    enabled: boolean
    directory: string
    saveJson: boolean
  }

  safety: {
    requireExplicitExecute: boolean
    transactionRequired: boolean
  }
}

export const ACE_CONFIG: AceConfig = {
  version: '1.0.0',

  defaults: {
    country: 'AR',
    language: 'es',
    mode: 'dry-run',
  },

  catalog: {
    /*
     * Reader consulta Supabase por lotes.
     */
    readBatchSize: 500,

    /*
     * Writer tradicional puede usar este tamaño.
     * Transaction Engine sigue siendo la vía
     * recomendada para producción.
     */
    writeBatchSize: 250,

    confidenceDefault: 70,

    globalByDefault: true,
  },

  enrichment: {
    enabled: true,

    provider: 'openfoodfacts',

    /*
     * Evitamos bombardear la API externa.
     */
    requestDelayMs: 150,

    confidence: 85,
  },

  progress: {
    enabled: true,
  },

  logs: {
    enabled: true,
    level: 'info',
    directory: 'logs/ace',
  },

  reports: {
    enabled: true,
    directory: 'reports/ace',
    saveJson: true,
  },

  safety: {
    /*
     * ACE nunca debe ejecutar cambios reales
     * por accidente.
     */
    requireExplicitExecute: true,

    /*
     * Producción debe utilizar el
     * Transaction Engine.
     */
    transactionRequired: true,
  },
}