import { supabase } from '@core/config/supabaseClient'
import type { FetchItem, EnvVar } from '../dto/types/fetchlab.types'

export const fetchlabService = {
  async loadWorkspace(): Promise<{ items: FetchItem[]; envVars: EnvVar[]; openTabs?: { openTabIds: string[]; activeTabId: string | null } } | null> {
    const { data, error } = await supabase
      .from('fl_workspaces')
      .select('items, env_vars, open_tabs')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      return null
    }

    return {
      items: (data.items as FetchItem[]) ?? [],
      envVars: (data.env_vars as EnvVar[]) ?? [],
      openTabs: data.open_tabs as { openTabIds: string[]; activeTabId: string | null } | undefined,
    }
  },

  async saveWorkspace(
    userId: string,
    items: FetchItem[],
    envVars: EnvVar[],
    openTabs?: { openTabIds: string[]; activeTabId: string | null },
  ): Promise<void> {
    const { error } = await supabase
      .from('fl_workspaces')
      .upsert(
        { user_id: userId, items, env_vars: envVars, open_tabs: openTabs ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
    if (error) throw new Error(error.message)
  },
}
