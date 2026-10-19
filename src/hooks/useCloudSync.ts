import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { mergeStates } from '../domain/merge'
import { useStore } from '../state/storeContext'
import { supabase } from '../sync/client'
import { pullState, pushState } from '../sync/remote'

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error'

const PUSH_DELAY_MS = 1000
const POLL_MS = 60_000

/**
 * Synchronisation avec Supabase quand l'utilisateur est connecté.
 * Chaque cycle : lire l'état distant, le fusionner avec le local (jour par jour, le plus récent gagne),
 * puis écrire le résultat si quelque chose a changé. Ainsi un appareil n'écrase jamais l'autre à l'aveugle.
 */
export function useCloudSync(user: User | null): { status: SyncStatus; lastSyncedAt: number | null; error: string | null } {
  const { state, actions } = useStore()
  const [status, setStatus] = useState<SyncStatus>('off')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Dernier état connu, lu par la synchro sans la relancer à chaque changement.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const inFlight = useRef(false)
  const again = useRef(false)
  const lastPushedJson = useRef<string | null>(null)

  const sync = useCallback(async () => {
    if (!supabase || !user) return
    if (inFlight.current) {
      again.current = true
      return
    }
    inFlight.current = true
    try {
      // Une demande arrivée pendant un cycle en relance un juste après (état local peut avoir changé).
      do {
        again.current = false
        setStatus('syncing')
        try {
          const remote = await pullState(supabase, user.id)
          const local = stateRef.current
          const merged = remote ? mergeStates(local, remote) : local
          if (merged !== local && remote) actions.mergeRemote(remote)
          const json = JSON.stringify(merged)
          if (json !== lastPushedJson.current) {
            await pushState(supabase, user.id, merged)
            lastPushedJson.current = json
          }
          setStatus('synced')
          setError(null)
          setLastSyncedAt(Date.now())
        } catch (e) {
          setStatus('error')
          setError(e instanceof Error ? e.message : 'Erreur de synchronisation')
        }
      } while (again.current)
    } finally {
      inFlight.current = false
    }
  }, [user, actions])

  // Connexion, retour sur l'onglet, puis rafraîchissement périodique.
  useEffect(() => {
    if (!user) {
      lastPushedJson.current = null
      return
    }
    void sync()
    const onVisible = () => document.visibilityState === 'visible' && void sync()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    const id = window.setInterval(onVisible, POLL_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.clearInterval(id)
    }
  }, [user, sync])

  // Chaque modification locale déclenche une synchro, groupée par un court délai.
  useEffect(() => {
    if (!user) return
    const id = window.setTimeout(() => void sync(), PUSH_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [state, user, sync])

  return { status: user ? status : 'off', lastSyncedAt, error }
}
