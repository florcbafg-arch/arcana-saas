import type { CatalogProduct } from '../types'

import {
  normalizeBarcode,
  normalizeBrand,
  normalizeProductName,
  normalizeQuantity,
  normalizeUnit,
} from '../core/normalizer'

import { buildProductSearchKeywords } from '../core/keywords'
import { readDelimitedFile } from './csv'

type EaxaRawRow = {
  id_comercio?: string
  id_bandera?: string
  id_sucursal?: string
  id_producto?: string
  productos_ean?: string
  productos_descripcion?: string
  productos_cantidad_presentacion?: string
  productos_unidad_medida_presentacion?: string
  productos_marca?: string
  productos_precio_lista?: string
  productos_precio_referencia?: string
  productos_cantidad_referencia?: string
  productos_unidad_medida_referencia?: string
  productos_precio_unitario_promo1?: string
  productos_leyenda_promo1?: string
  productos_precio_unitario_promo2?: string
  productos_leyenda_promo2?: string
}

export type EaxaAdapterResult = {
  products: CatalogProduct[]
  totalRows: number
  emptyRows: number
  malformedRows: number
}

/**
 * Lee el archivo CSV de EAXA.
 *
 * Aunque sea un archivo .csv, sus columnas
 * están separadas mediante el carácter "|".
 */
export function readEaxaFile(
  filePath: string
): EaxaAdapterResult {
  const fileResult = readDelimitedFile(
    filePath,
    '|'
  )

  const products = fileResult.rows.map((row) =>
    mapEaxaRowToCatalogProduct(
      row as EaxaRawRow
    )
  )

  return {
    products,
    totalRows: fileResult.totalRows,
    emptyRows: fileResult.emptyRows,
    malformedRows: fileResult.malformedRows,
  }
}

/**
 * Convierte una fila de EAXA al formato
 * universal utilizado por ACE.
 */
function mapEaxaRowToCatalogProduct(
  row: EaxaRawRow
): CatalogProduct {
  /*
   * En el archivo EAXA:
   *
   * id_producto = código real del producto
   * productos_ean = indicador 1 o 0
   */
  const barcode = normalizeBarcode(
    row.id_producto
  )

  const name = normalizeProductName(
    row.productos_descripcion
  )

  const brand = normalizeBrand(
    row.productos_marca
  )

  const quantity = normalizeQuantity(
    row.productos_cantidad_presentacion
  )

  const unit = normalizeUnit(
    row.productos_unidad_medida_presentacion
  )

  const baseProduct = {
    barcode,
    name,
    brand,
    category: null,
    image_url: null,
    quantity,
    unit,
  }

  return {
    ...baseProduct,

    source: 'eaxa_import',
    country: 'AR',
    confidence: getInitialConfidence(row),
    verified: false,
    is_global: true,
    times_used: 0,

    search_keywords:
      buildProductSearchKeywords(
        baseProduct
      ),

    created_by: null,
  }
}

/**
 * productos_ean:
 *
 * "1" = EAXA identifica el código como EAN.
 * "0" = probablemente sea un código interno.
 */
function getInitialConfidence(
  row: EaxaRawRow
): number {
  const eanIndicator = String(
    row.productos_ean ?? ''
  ).trim()

  if (eanIndicator === '1') {
    return 85
  }

  return 65
}