import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

import type { CatalogProduct } from '../types'
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

export type SupabaseCatalogReadResult = {
  requestedBarcodes: number
  foundProducts: number
  missingProducts: number
  productsByBarcode: Map<string, CatalogProduct>
}

/**
 * Busca productos existentes en arcana_catalog
 * procesando los códigos en lotes.
 */
export async function readCatalogProductsByBarcodes(
  barcodes: string[],
  batchSize =
    ACE_CONFIG.catalog.readBatchSize
): Promise<SupabaseCatalogReadResult> {
  const cleanBarcodes = Array.from(
    new Set(
      barcodes
        .map((barcode) => String(barcode ?? '').trim())
        .filter(Boolean)
    )
  )

  const productsByBarcode =
    new Map<string, CatalogProduct>()

  for (
    let startIndex = 0;
    startIndex < cleanBarcodes.length;
    startIndex += batchSize
  ) {
    const batch = cleanBarcodes.slice(
      startIndex,
      startIndex + batchSize
    )

    const { data, error } = await supabase
      .from('arcana_catalog')
      .select(
        [
          'barcode',
          'name',
          'brand',
          'category',
          'image_url',
          'quantity',
          'unit',
          'source',
          'country',
          'confidence',
          'verified',
          'is_global',
          'times_used',
          'search_keywords',
          'created_by',
        ].join(',')
      )
      .in('barcode', batch)

    if (error) {
      throw new Error(
        [
          'ACE no pudo consultar arcana_catalog.',
          `Lote iniciado en posición: ${startIndex}`,
          `Detalle: ${error.message}`,
        ].join('\n')
      )
    }

    
    const catalogRows =
  (data ?? []) as unknown as Record<string, unknown>[]

for (const rawProduct of catalogRows) {
  const product =
    mapSupabaseRowToCatalogProduct(rawProduct)

  productsByBarcode.set(
    product.barcode,
    product
  )
}
  }

  return {
    requestedBarcodes: cleanBarcodes.length,
    foundProducts: productsByBarcode.size,
    missingProducts:
      cleanBarcodes.length - productsByBarcode.size,
    productsByBarcode,
  }
}

function mapSupabaseRowToCatalogProduct(
  row: Record<string, unknown>
): CatalogProduct {
  return {
    barcode: String(row.barcode ?? ''),
    name: String(row.name ?? ''),
    brand: toNullableString(row.brand),
    category: toNullableString(row.category),
    image_url: toNullableString(row.image_url),
    quantity: toNullableString(row.quantity),
    unit: toNullableString(row.unit),
    source: String(row.source ?? 'manual'),
    country: String(row.country ?? 'AR'),
    confidence: Number(row.confidence ?? 70),
    verified: Boolean(row.verified),
    is_global: Boolean(row.is_global ?? true),
    times_used: Number(row.times_used ?? 0),
    search_keywords: Array.isArray(
      row.search_keywords
    )
      ? row.search_keywords.map(String)
      : [],
    created_by: toNullableString(row.created_by),
  }
}

function toNullableString(
  value: unknown
): string | null {
  const text = String(value ?? '').trim()

  return text || null
}