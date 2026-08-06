import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

import type {
  CatalogPlanItem,
  CatalogSyncPlan,
} from '../types'

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

export type TransactionResult = {
  success: boolean
  inserted: number
  updated: number
  kept: number
}

/**
 * Ejecuta un plan completo dentro de una única
 * transacción PostgreSQL.
 *
 * Si cualquier INSERT o UPDATE falla,
 * Supabase revierte toda la operación.
 */
export async function applyCatalogTransaction(
  plan: CatalogSyncPlan
): Promise<TransactionResult> {
  const inserts = plan.inserts.map((item) =>
    toTransactionRow(item)
  )

  const updates = plan.updates.map((item) =>
    toTransactionRow(item)
  )

  const { data, error } = await supabase.rpc(
    'ace_apply_catalog_plan',
    {
      p_inserts: inserts,
      p_updates: updates,
    }
  )

  if (error) {
    throw new Error(
      [
        'ACE Transaction Engine abortó la sincronización.',
        '',
        'No se confirmó ningún cambio de esta transacción.',
        '',
        `Detalle: ${error.message}`,
      ].join('\n')
    )
  }

  const result =
    data as unknown as {
      success?: boolean
      inserted?: number
      updated?: number
    }

  return {
    success: result.success === true,
    inserted: Number(result.inserted ?? 0),
    updated: Number(result.updated ?? 0),
    kept: plan.keeps.length,
  }
}

function toTransactionRow(
  item: CatalogPlanItem
) {
  const product = item.finalProduct

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
    search_keywords:
      product.search_keywords,
    created_by:
      product.created_by ?? null,
    last_used_at: null,
  }
}