import type {
  CatalogPlanItem,
  CatalogProduct,
  CatalogSyncPlan,
} from '../types'

import { compareCatalogProducts } from './comparator'

/**
 * Crea un plan de sincronización sin modificar Supabase.
 */
export function createCatalogSyncPlan(
  incomingProducts: CatalogProduct[],
  existingProductsByBarcode: Map<string, CatalogProduct>
): CatalogSyncPlan {
  const inserts: CatalogPlanItem[] = []
  const updates: CatalogPlanItem[] = []
  const keeps: CatalogPlanItem[] = []

  for (const incomingProduct of incomingProducts) {
    const currentProduct =
      existingProductsByBarcode.get(
        incomingProduct.barcode
      )

    if (!currentProduct) {
      inserts.push({
        barcode: incomingProduct.barcode,
        action: 'insert',
        incomingProduct,
        currentProduct: null,
        finalProduct: incomingProduct,
        reasons: [
          'El código no existe en arcana_catalog.',
        ],
      })

      continue
    }

    const comparison = compareCatalogProducts(
      currentProduct,
      incomingProduct
    )

    const reasons = comparison.changes
      .filter(
        (change) =>
          change.action === 'fill' ||
          change.action === 'replace'
      )
      .map(
        (change) =>
          `${change.field}: ${change.reason}`
      )

    if (comparison.hasChanges) {
      updates.push({
        barcode: incomingProduct.barcode,
        action: 'update',
        incomingProduct,
        currentProduct,
        finalProduct: comparison.mergedProduct,
        reasons,
      })

      continue
    }

    keeps.push({
      barcode: incomingProduct.barcode,
      action: 'keep',
      incomingProduct,
      currentProduct,
      finalProduct: currentProduct,
      reasons: [
        'Arcana ya conserva información igual o mejor.',
      ],
    })
  }

  return {
    total: incomingProducts.length,
    inserts,
    updates,
    keeps,
  }
}