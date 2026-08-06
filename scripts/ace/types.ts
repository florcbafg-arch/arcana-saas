export interface CatalogProduct {
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
}

export interface ImportStats {

  total: number

  inserted: number

  updated: number

  duplicated: number

  invalid: number

  failed: number
}

export interface ImportResult {

  success: boolean

  product?: CatalogProduct

  reason?: string
}