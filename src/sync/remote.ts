import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppState } from '../domain/types'
import { isAppState } from '../storage/localStorage'

const TABLE = 'app_state'

/** Lit l'état distant de l'utilisateur ; null s'il n'existe pas encore ou s'il est invalide. */
export async function pullState(client: SupabaseClient, userId: string): Promise<AppState | null> {
  const { data, error } = await client.from(TABLE).select('state').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data && isAppState(data.state) ? data.state : null
}

export async function pushState(client: SupabaseClient, userId: string, state: AppState): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}
