import { readEaxaFile } from '../adapters/eaxa'

import {
  prepareCatalogImport,
} from './importer'

import {
  inspectCatalogDataset,
} from './inspector'

import {
  readCatalogProductsByBarcodes,
} from './supabase-reader'

import {
  createCatalogSyncPlan,
} from './planner'

import {
  enrichCatalogProducts,
} from './enricher'

import {
  applyCatalogTransaction,
} from './transaction'

import {
  AceProgress,
  printProgress,
} from './progress'

import {
  AceLogger,
} from './logger'

import type {
  CatalogProduct,
} from '../types'

export type PipelineMode =
  | 'dry-run'
  | 'execute'

export type PipelineOptions = {
  filePath: string
  mode?: PipelineMode
  enrich?: boolean
}

export type PipelineResult = {
  mode: PipelineMode

  rowsRead: number
  uniqueProducts: number

  plannedInserts: number
  plannedUpdates: number
  plannedKeeps: number

  enrichedProducts: number

  inserted: number
  updated: number
  kept: number

  durationMs: number
  logFile: string
}

/**
 * Orquestador principal de ACE.
 *
 * Coordina todos los motores sin asumir
 * las responsabilidades de ninguno.
 */
export async function runAcePipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const startedAt =
    Date.now()

  const mode =
    options.mode ?? 'dry-run'

  const enrich =
    options.enrich ?? true

  const logger =
    new AceLogger('ace-pipeline')

  const progress =
    new AceProgress(printProgress)

  logger.info(
    'ACE Pipeline iniciado.',
    {
      filePath:
        options.filePath,
      mode,
      enrich,
    }
  )

  try {
    /*
     * =========================================
     * 1. LEER ARCHIVO
     * =========================================
     */

    progress.startStage(
      'reading',
      1,
      'Leyendo catálogo...'
    )

    const adapterResult =
      readEaxaFile(
        options.filePath
      )

    progress.completeStage(
      'Catálogo leído.'
    )

    logger.success(
      'Archivo leído correctamente.',
      {
        totalRows:
          adapterResult.totalRows,

        emptyRows:
          adapterResult.emptyRows,

        malformedRows:
          adapterResult.malformedRows,
      }
    )

    /*
     * =========================================
     * 2. PREPARAR IMPORTACIÓN
     * =========================================
     */

    progress.startStage(
      'normalizing',
      1,
      'Normalizando productos...'
    )

    const preparedImport =
      prepareCatalogImport(
        adapterResult.products
      )

    progress.completeStage(
      'Productos normalizados.'
    )

    logger.success(
      'Importación preparada.',
      {
        validProducts:
          preparedImport.products.length,

        duplicates:
          preparedImport.stats.duplicated,

        invalid:
          preparedImport.stats.invalid,
      }
    )

    /*
     * =========================================
     * 3. INSPECTOR
     * =========================================
     */

    progress.startStage(
      'inspecting',
      1,
      'Analizando calidad del catálogo...'
    )

    const inspection =
      inspectCatalogDataset(
        preparedImport.products
      )

    progress.completeStage(
      `Dataset Score: ${inspection.healthScore}/100`
    )

    logger.info(
      'Dataset inspeccionado.',
      {
        healthScore:
          inspection.healthScore,

        healthLabel:
          inspection.healthLabel,

        uniqueProducts:
          inspection.uniqueProducts,
      }
    )

    /*
     * =========================================
     * 4. CONSULTAR SUPABASE
     * =========================================
     */

    const barcodes =
      preparedImport.products.map(
        (product) =>
          product.barcode
      )

    progress.startStage(
      'reading_catalog',
      barcodes.length,
      'Consultando catálogo global...'
    )

    const catalogResult =
      await readCatalogProductsByBarcodes(
        barcodes
      )

    progress.completeStage(
      'Catálogo global consultado.'
    )

    logger.info(
      'Supabase Reader completado.',
      {
        requested:
          catalogResult.requestedBarcodes,

        found:
          catalogResult.foundProducts,

        missing:
          catalogResult.missingProducts,
      }
    )

    /*
     * =========================================
     * 5. PLANNER
     * =========================================
     */

    progress.startStage(
      'planning',
      preparedImport.products.length,
      'Planificando sincronización...'
    )

    const initialPlan =
      createCatalogSyncPlan(
        preparedImport.products,
        catalogResult.productsByBarcode
      )

    progress.completeStage(
      'Plan de sincronización creado.'
    )

    logger.success(
      'Planner completado.',
      {
        inserts:
          initialPlan.inserts.length,

        updates:
          initialPlan.updates.length,

        keeps:
          initialPlan.keeps.length,
      }
    )

    /*
     * =========================================
     * 6. ENRIQUECIMIENTO
     * =========================================
     */

    let enrichmentUpdates =
      initialPlan.updates

    let enrichedProducts = 0

    if (enrich) {
      const productsToEnrich =
        buildProductsForEnrichment(
          preparedImport.products,
          catalogResult.productsByBarcode
        )

      progress.startStage(
        'enriching',
        productsToEnrich.length,
        'Consultando Open Food Facts...'
      )

      const enrichment =
        await enrichCatalogProducts(
          productsToEnrich
        )

      enrichedProducts =
        enrichment.stats.improved

      enrichmentUpdates =
        mergeUpdatePlans(
          initialPlan.updates,
          enrichment.plan.updates
        )

      progress.completeStage(
        `Enriquecimiento terminado: ${enrichedProducts} mejoras.`
      )

      logger.info(
        'Enrichment Engine completado.',
        enrichment.stats
      )
    }

    /*
     * =========================================
     * 7. PLAN FINAL
     * =========================================
     */

    const finalPlan = {
      total:
        initialPlan.total,

      inserts:
        initialPlan.inserts,

      updates:
        enrichmentUpdates,

      keeps:
        initialPlan.keeps,
    }

    /*
     * =========================================
     * 8. DRY RUN
     * =========================================
     */

    if (mode === 'dry-run') {
      progress.complete(
        'ACE finalizó en modo simulación.'
      )

      logger.success(
        'Pipeline terminado en dry-run.',
        {
          inserts:
            finalPlan.inserts.length,

          updates:
            finalPlan.updates.length,

          keeps:
            finalPlan.keeps.length,
        }
      )

      return {
        mode,

        rowsRead:
          adapterResult.totalRows,

        uniqueProducts:
          preparedImport.products.length,

        plannedInserts:
          finalPlan.inserts.length,

        plannedUpdates:
          finalPlan.updates.length,

        plannedKeeps:
          finalPlan.keeps.length,

        enrichedProducts,

        inserted: 0,
        updated: 0,
        kept:
          finalPlan.keeps.length,

        durationMs:
          Date.now() -
          startedAt,

        logFile:
          logger.getFilePath(),
      }
    }

    /*
     * =========================================
     * 9. TRANSACCIÓN REAL
     * =========================================
     */

    progress.startStage(
      'writing',
      finalPlan.inserts.length +
        finalPlan.updates.length,
      'Aplicando cambios en Arcana...'
    )

    const transaction =
      await applyCatalogTransaction(
        finalPlan
      )

    progress.completeStage(
      'Cambios aplicados.'
    )

    progress.complete(
      'ACE terminó correctamente.'
    )

    logger.success(
      'Transacción confirmada.',
      transaction
    )

    return {
      mode,

      rowsRead:
        adapterResult.totalRows,

      uniqueProducts:
        preparedImport.products.length,

      plannedInserts:
        finalPlan.inserts.length,

      plannedUpdates:
        finalPlan.updates.length,

      plannedKeeps:
        finalPlan.keeps.length,

      enrichedProducts,

      inserted:
        transaction.inserted,

      updated:
        transaction.updated,

      kept:
        transaction.kept,

      durationMs:
        Date.now() -
        startedAt,

      logFile:
        logger.getFilePath(),
    }

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error desconocido.'

    progress.fail(
      'ACE terminó con error.'
    )

    logger.error(
      'Pipeline abortado.',
      {
        error: message,
      }
    )

    throw error
  }
}

/**
 * Para nuevos productos usamos la versión
 * proveniente del archivo.
 *
 * Para productos existentes usamos la versión
 * actual del catálogo global.
 */
function buildProductsForEnrichment(
  incomingProducts: CatalogProduct[],
  existingProducts:
    Map<string, CatalogProduct>
): CatalogProduct[] {
  return incomingProducts.map(
    (incomingProduct) => {
      return (
        existingProducts.get(
          incomingProduct.barcode
        ) ??
        incomingProduct
      )
    }
  )
}

/**
 * Combina planes de actualización por barcode.
 *
 * Si Enrichment produjo una versión mejor,
 * esa versión reemplaza el update anterior.
 */
function mergeUpdatePlans(
  initialUpdates: any[],
  enrichmentUpdates: any[]
): any[] {
  const updatesByBarcode =
    new Map<string, any>()

  for (
    const update
    of initialUpdates
  ) {
    updatesByBarcode.set(
      update.barcode,
      update
    )
  }

  for (
    const update
    of enrichmentUpdates
  ) {
    updatesByBarcode.set(
      update.barcode,
      update
    )
  }

  return Array.from(
    updatesByBarcode.values()
  )
}