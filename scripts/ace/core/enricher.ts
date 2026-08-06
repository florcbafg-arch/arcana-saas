import type {
  CatalogPlanItem,
  CatalogProduct,
  CatalogSyncPlan,
} from '../types'

import {
  compareCatalogProducts,
} from './comparator'

import {
  fetchOpenFoodFactsProduct,
} from '../adapters/openFoodFacts'

import {
  isValidEAN13,
} from './validator'

export type EnrichmentStats = {
  total: number
  eligible: number
  found: number
  notFound: number
  improved: number
  unchanged: number
  failed: number
}

export type EnrichmentResult = {
  plan: CatalogSyncPlan
  stats: EnrichmentStats
}

/**
 * Enriquece productos utilizando Open Food Facts.
 *
 * No modifica Supabase.
 * Genera un nuevo plan para Transaction Engine.
 */
export async function enrichCatalogProducts(
  products: CatalogProduct[],
  delayMs = 150
): Promise<EnrichmentResult> {
  const updates: CatalogPlanItem[] = []
  const keeps: CatalogPlanItem[] = []

  const stats: EnrichmentStats = {
    total: products.length,
    eligible: 0,
    found: 0,
    notFound: 0,
    improved: 0,
    unchanged: 0,
    failed: 0,
  }

  for (const currentProduct of products) {
    if (!isValidEAN13(
      currentProduct.barcode
    )) {
      keeps.push(
        createKeepItem(
          currentProduct,
          'El producto no tiene un EAN-13 válido.'
        )
      )

      continue
    }

    stats.eligible += 1

    try {
      const lookup =
        await fetchOpenFoodFactsProduct(
          currentProduct.barcode
        )

      if (
        !lookup.found ||
        !lookup.product
      ) {
        stats.notFound += 1

        keeps.push(
          createKeepItem(
            currentProduct,
            lookup.reason ??
              'Open Food Facts no aportó información.'
          )
        )

        await wait(delayMs)
        continue
      }

      stats.found += 1

      const comparison =
        compareCatalogProducts(
          currentProduct,
          lookup.product
        )

      if (!comparison.hasChanges) {
        stats.unchanged += 1

        keeps.push({
          barcode:
            currentProduct.barcode,

          action: 'keep',

          incomingProduct:
            lookup.product,

          currentProduct,

          finalProduct:
            currentProduct,

          reasons: [
            'Open Food Facts no aportó información mejor.',
          ],
        })

        await wait(delayMs)
        continue
      }

      stats.improved += 1

      const reasons =
        comparison.changes
          .filter(
            (change) =>
              change.action === 'fill' ||
              change.action === 'replace'
          )
          .map(
            (change) =>
              `${change.field}: ${change.reason}`
          )

      updates.push({
        barcode:
          currentProduct.barcode,

        action: 'update',

        incomingProduct:
          lookup.product,

        currentProduct,

        finalProduct:
          comparison.mergedProduct,

        reasons,
      })

      await wait(delayMs)

    } catch (error) {
      stats.failed += 1

      keeps.push(
        createKeepItem(
          currentProduct,
          error instanceof Error
            ? error.message
            : 'Error desconocido durante el enriquecimiento.'
        )
      )

      await wait(delayMs)
    }
  }

  return {
    plan: {
      total: products.length,
      inserts: [],
      updates,
      keeps,
    },

    stats,
  }
}

function createKeepItem(
  product: CatalogProduct,
  reason: string
): CatalogPlanItem {
  return {
    barcode: product.barcode,
    action: 'keep',
    incomingProduct: product,
    currentProduct: product,
    finalProduct: product,
    reasons: [reason],
  }
}

function wait(
  milliseconds: number
): Promise<void> {
  if (milliseconds <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    setTimeout(
      resolve,
      milliseconds
    )
  })
}