import { supabase } from '@core/config/supabaseClient'
import type { FetchItem, EnvVar, HistoryEntry } from '../dto/types/fetchlab.types'

// ── Workspace (items tree + env vars) ────────────────────────
export const fetchlabService = {
  /**
   * Load the workspace for the current user.
   * Returns null if no workspace exists yet (first time user).
   */
  async loadWorkspace(): Promise<{ items: FetchItem[]; envVars: EnvVar[] } | null> {
    const { data, error } = await supabase
      .from('fl_workspaces')
      .select('items, env_vars')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // no rows — first launch
      console.error('[FetchLab] loadWorkspace:', error.message)
      return null
    }

    return {
      items: (data.items as FetchItem[]) ?? [],
      envVars: (data.env_vars as EnvVar[]) ?? [],
    }
  },

  /**
   * Upsert the entire workspace snapshot.
   * Called on every mutation (debounced in the slice).
   */
  async saveWorkspace(
    userId: string,
    items: FetchItem[],
    envVars: EnvVar[],
  ): Promise<void> {
    const { error } = await supabase
      .from('fl_workspaces')
      .upsert(
        { user_id: userId, items, env_vars: envVars, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
    if (error) console.error('[FetchLab] saveWorkspace:', error.message)
  },

  // ── History ────────────────────────────────────────────────
  async loadHistory(): Promise<HistoryEntry[]> {
    const { data, error } = await supabase
      .from('fl_history')
      .select('id, method, url, status, duration, size, created_at')
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) {
      console.error('[FetchLab] loadHistory:', error.message)
      return []
    }

    return (data ?? []).map(r => ({
      id: r.id,
      method: r.method,
      url: r.url,
      status: r.status,
      duration: r.duration,
      size: r.size,
      timestamp: r.created_at,
    }))
  },

  async addHistory(userId: string, entry: HistoryEntry): Promise<void> {
    const { error } = await supabase.from('fl_history').insert({
      id: entry.id,
      user_id: userId,
      method: entry.method,
      url: entry.url,
      status: entry.status,
      duration: entry.duration,
      size: entry.size,
    })
    if (error) console.error('[FetchLab] addHistory:', error.message)
  },

  async clearHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('fl_history')
      .delete()
      .eq('user_id', userId)
    if (error) console.error('[FetchLab] clearHistory:', error.message)
  },
}
