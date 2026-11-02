import { toSheet, type Cell, type Sheet } from './importSheet'

// Reads an uploaded .csv, .xlsx or .xls in the browser. The parsers (papaparse, and the
// official SheetJS build from cdn.sheetjs.com) load only when a file is picked.

export const ACCEPT = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

export interface Workbook {
  // One entry per sheet (a CSV has one).
  sheets: { name: string; sheet: Sheet }[]
}

export async function readSheetFile(file: File): Promise<Workbook> {
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'csv' || file.type === 'text/csv') {
    const { default: Papa } = await import('papaparse')
    const parsed = Papa.parse<Cell[]>(await file.text(), { skipEmptyLines: 'greedy' })
    return { sheets: [{ name: file.name, sheet: toSheet(parsed.data) }] }
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx')
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    return {
      sheets: wb.SheetNames.map((name) => ({
        name,
        // raw: dates stay Excel date numbers, which the import reads exactly.
        sheet: toSheet(XLSX.utils.sheet_to_json<Cell[]>(wb.Sheets[name], { header: 1, raw: true, defval: '', blankrows: false })),
      })).filter((s) => s.sheet.headers.length > 0),
    }
  }
  throw new Error('Choose a .csv, .xlsx or .xls file.')
}
