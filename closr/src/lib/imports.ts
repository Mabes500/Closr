import { useQueryClient } from '@tanstack/react-query'
import type { Prepared } from './importSheet'
import { supabase } from './supabase'

// Saving a spreadsheet import, and undoing it. Every row carries the import's id
// (applications.import_id), so undo deletes exactly that batch and nothing else.

const BATCH = 100
const LAST_KEY = 'closr-last-import'

export type LastImport = { id: string; count: number; file: string; at: string }

// The most recent import on this device, so "Undo" still works after leaving the page.
export function lastImport(): LastImport | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null') as LastImport | null
    // Offer undo for a day; after that the jobs are just part of the board.
    return v && Date.now() - Date.parse(v.at) < 86_400_000 ? v : null
  } catch {
    return null
  }
}
function remember(v: LastImport | null) {
  try {
    if (v) localStorage.setItem(LAST_KEY, JSON.stringify(v))
    else localStorage.removeItem(LAST_KEY)
  } catch {
    // Storage unavailable: undo is still offered on the results screen.
  }
}

export function useImportJobs() {
  const qc = useQueryClient()

  async function run(rows: Prepared[], file: string, onProgress: (done: number) => void) {
    const importId = rows[0]?.values.import_id
    let done = 0
    try {
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await supabase.from('applications').insert(rows.slice(i, i + BATCH).map((r) => r.values))
        if (error) throw error
        done += Math.min(BATCH, rows.length - i)
        onProgress(done)
      }
    } catch (e) {
      // Leave nothing half-imported: remove whatever this import already added.
      if (done && importId) await supabase.from('applications').delete().eq('import_id', importId)
      throw e
    } finally {
      qc.invalidateQueries({ queryKey: ['applications'] })
    }
    remember({ id: importId!, count: rows.length, file, at: new Date().toISOString() })
  }

  async function undo(importId: string) {
    const { error } = await supabase.from('applications').delete().eq('import_id', importId)
    qc.invalidateQueries({ queryKey: ['applications'] })
    if (error) throw error
    remember(null)
  }

  return { run, undo }
}
