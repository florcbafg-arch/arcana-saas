import fs from 'node:fs'

export type DelimitedFileResult = {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  emptyRows: number
  malformedRows: number
}

/**
 * Lee archivos de texto delimitados.
 *
 * Puede trabajar con:
 * - CSV separado por comas
 * - archivos separados por punto y coma
 * - archivos separados por |
 *
 * El archivo de EAXA utiliza "|".
 */
export function readDelimitedFile(
  filePath: string,
  delimiter = ','
): DelimitedFileResult {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el archivo: ${filePath}`)
  }

  const content = fs
    .readFileSync(filePath, 'utf8')
    .replace(/^\uFEFF/, '')

  const lines = content.split(/\r?\n/)

  if (lines.length === 0) {
    throw new Error('El archivo está vacío')
  }

  const headerLine = String(lines[0] ?? '').trim()

  if (!headerLine) {
    throw new Error('No se encontró el encabezado del archivo')
  }

  const headers = headerLine
    .split(delimiter)
    .map((header) => header.trim())

  const rows: Record<string, string>[] = []

  let emptyRows = 0
  let malformedRows = 0

  for (let index = 1; index < lines.length; index += 1) {
    const line = String(lines[index] ?? '').trim()

    if (!line) {
      emptyRows += 1
      continue
    }

    const values = line.split(delimiter)

    if (values.length < headers.length) {
      malformedRows += 1
      continue
    }

    const row: Record<string, string> = {}

    headers.forEach((header, columnIndex) => {
      row[header] = String(
        values[columnIndex] ?? ''
      ).trim()
    })

    rows.push(row)
  }

  return {
    headers,
    rows,
    totalRows: Math.max(lines.length - 1, 0),
    emptyRows,
    malformedRows,
  }
}