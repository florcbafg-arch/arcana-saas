import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

import type {
  CatalogPlanItem,
  CatalogSyncPlan,
} from '../types'

import {
  ACE_CONFIG,
} from '../config'

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
})

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error(
    'Falta NEXT_PUBLIC_SUPABASE_URL en .env.local'
  )
}

if (!serviceRoleKey) {
  throw new Error(
    'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local'
  )
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

export type WriterMode =
  | 'dry-run'
  | 'execute'

export type WriterResult = {
  mode: WriterMode
  plannedInserts: number
  plannedUpdates: number
  plannedKeeps: number
  inserted: number
  updated: number
  failed: number
}

/**
 * Ejecuta un plan generado por ACE Planner.
 *
 * dry-run:
 * no modifica Supabase.
 *
 * execute:
 * inserta y actualiza realmente.
 */
export async function executeCatalogPlan(
  plan: CatalogSyncPlan,
  mode: WriterMode = 'dry-run',
  batchSize =
  ACE_CONFIG.catalog.writeBatchSize
): Promise<WriterResult> {
  if (mode === 'dry-run') {
    return {
      mode,
      plannedInserts: plan.inserts.length,
      plannedUpdates: plan.updates.length,
      plannedKeeps: plan.keeps.length,
      inserted: 0,
      updated: 0,
      failed: 0,
    }
  }

  let inserted = 0
  let updated = 0
  let failed = 0

  for (
    let startIndex = 0;
    startIndex < plan.inserts.length;
    startIndex += batchSize
  ) {
    const batch = plan.inserts.slice(
      startIndex,
      startIndex + batchSize
    )

    const insertResult =
      await insertCatalogBatch(batch)

    inserted += insertResult.success
    failed += insertResult.failed
  }

  for (
    let startIndex = 0;
    startIndex < plan.updates.length;
    startIndex += batchSize
  ) {
    const batch = plan.updates.slice(
      startIndex,
      startIndex + batchSize
    )

    const updateResult =
      await updateCatalogBatch(batch)

    updated += updateResult.success
    failed += updateResult.failed
  }

  return {
    mode,
    plannedInserts: plan.inserts.length,
    plannedUpdates: plan.updates.length,
    plannedKeeps: plan.keeps.length,
    inserted,
    updated,
    failed,
  }
}

async function insertCatalogBatch(
  items: CatalogPlanItem[]
): Promise<{
  success: number
  failed: number
}> {
  if (items.length === 0) {
    return {
      success: 0,
      failed: 0,
    }
  }

  const rows = items.map((item) =>
    toSupabaseRow(item.finalProduct)
  )

  const { error } = await supabase
    .from('arcana_catalog')
    .insert(rows)

  if (error) {
    console.error('')
    console.error(
      `ACE Writer: falló un lote de INSERT (${items.length}).`
    )
    console.error(error.message)
    console.error('')

    return {
      success: 0,
      failed: items.length,
    }
  }

  return {
    success: items.length,
    failed: 0,
  }
}

async function updateCatalogBatch(
  items: CatalogPlanItem[]
): Promise<{
  success: number
  failed: number
}> {
  let success = 0
  let failed = 0

  /*
   * Los updates se ejecutan individualmente
   * porque cada producto puede tener datos distintos.
   */
  for (const item of items) {
    const row = toSupabaseRow(
      item.finalProduct
    )

    const { error } = await supabase
      .from('arcana_catalog')
      .update(row)
      .eq('barcode', item.barcode)

    if (error) {
      failed += 1

      console.error(
        `ACE Writer: error actualizando ${item.barcode}: ${error.message}`
      )

      continue
    }

    success += 1
  }

  return {
    success,
    failed,
  }
}

function toSupabaseRow(product: {
  barcode: string
  name: string
  brand: string | null
  category: string | null
  image_url: string | null
  quantity: string | null
  unit: string | null
  source: string
  country: string
  confidence: number
  verified: boolean
  is_global: boolean
  times_used: number
  search_keywords: string[]
  created_by?: string | null
}) {
  return {
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    category: product.category,
    image_url: product.image_url,
    quantity: product.quantity,
    unit: product.unit,
    source: product.source,
    country: product.country,
    confidence: product.confidence,
    verified: product.verified,
    is_global: product.is_global,
    times_used: product.times_used,
    search_keywords: product.search_keywords,
    created_by:
      product.created_by ?? null,
    updated_at: new Date().toISOString(),
  }
}