import * as XLSX from 'xlsx'

import type { CatalogProduct } from '../types'

import {
  normalizeBarcode,
  normalizeBrand,
  normalizeProductName,
  normalizeQuantity,
  normalizeUnit,
} from '../core/normalizer'

import { buildProductSearchKeywords } from '../core/keywords'

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
 * Lee el archivo de EAXA.
 *
 * Aunque el archivo termina en .xlsx, internamente contiene
 * una única columna cuyos campos están separados por "|".
 */
export function readEaxaFile(filePath: string): EaxaAdapterResult {
  const workbook = XLSX.readFile(filePath, {
    raw: false,
    cellText: true,
  })

  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    throw new Error('El archivo no contiene ninguna hoja')
  }

  const worksheet = workbook.Sheets[firstSheetName]

  if (!worksheet) {
    throw new Error('No se pudo leer la primera hoja del archivo')
  }

  /*
   * Obtenemos cada fila como un arreglo.
   *
   * En este archivo el contenido completo está en la primera
   * celda de cada fila.
   */
  const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: false,
    defval: '',
  })

  if (sheetRows.length === 0) {
    throw new Error('El archivo está vacío')
  }

  const headerLine = String(sheetRows[0]?.[0] ?? '').trim()

  if (!headerLine) {
    throw new Error('No se encontró el encabezado del archivo')
  }

  const headers = headerLine
    .split('|')
    .map((header) => header.trim())

  const products: CatalogProduct[] = []

  let emptyRows = 0
  let malformedRows = 0

  for (let index = 1; index < sheetRows.length; index += 1) {
    const originalLine = String(sheetRows[index]?.[0] ?? '').trim()

    if (!originalLine) {
      emptyRows += 1
      continue
    }

    const values = originalLine.split('|')

    if (values.length < headers.length) {
      malformedRows += 1
      continue
    }

    const rawRow = createRawRow(headers, values)

    const product = mapEaxaRowToCatalogProduct(rawRow)

    products.push(product)
  }

  return {
    products,
    totalRows: sheetRows.length - 1,
    emptyRows,
    malformedRows,
  }
}

/**
 * Convierte encabezados y valores separados por "|"
 * en un objeto con los nombres originales del archivo.
 */
function createRawRow(
  headers: string[],
  values: string[]
): EaxaRawRow {
  const row: Record<string, string> = {}

  headers.forEach((header, index) => {
    row[header] = String(values[index] ?? '').trim()
  })

  return row as EaxaRawRow
}

/**
 * Convierte una fila del archivo EAXA
 * al formato universal utilizado por ACE.
 */
function mapEaxaRowToCatalogProduct(
  row: EaxaRawRow
): CatalogProduct {
  /*
   * En este archivo, id_producto contiene el código real.
   * productos_ean contiene un indicador 1/0.
   */
  const barcode = normalizeBarcode(row.id_producto)

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

    search_keywords: buildProductSearchKeywords(
      baseProduct
    ),

    created_by: null,
  }
}

/**
 * Asigna un nivel inicial de confianza.
 *
 * productos_ean:
 * "1" = el archivo lo identifica como EAN.
 * "0" = probablemente sea un código interno.
 */
function getInitialConfidence(row: EaxaRawRow): number {
  const eanIndicator = String(
    row.productos_ean ?? ''
  ).trim()

  if (eanIndicator === '1') {
    return 85
  }

  return 65
}