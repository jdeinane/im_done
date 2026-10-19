import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { browserStorage, loadState, saveState, STORAGE_KEY } from '../storage/localStorage'
import { initialState } from './defaults'
import { reducer } from './reducer'
import { StoreContext, type Actions } from './storeContext'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    // Le « tick » initial applique le changement de jour avant le premier rendu.
    reducer(loadState(browserStorage()) ?? initialState(), { type: 'tick', now: Date.now() }),
  )

  useEffect(() => saveState(browserStorage(), state), [state])

  useEffect(() => {
    const tick = () => dispatch({ type: 'tick', now: Date.now() })
    const onVisible = () => document.visibilityState === 'visible' && tick()
    // Reprise après veille / retour sur l'onglet : on recale le jour courant.
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', tick)

    // Un autre onglet a modifié l'état : on le reprend plutôt que de l'écraser.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = loadState(browserStorage())
      if (next) dispatch({ type: 'hydrate', state: next, now: Date.now() })
    }
    window.addEventListener('storage', onStorage)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', tick)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const actions = useMemo<Actions>(() => {
    const now = () => Date.now()
    return {
      tick: () => dispatch({ type: 'tick', now: now() }),
      start: (blockId) => dispatch({ type: 'start', blockId, now: now() }),
      pause: () => dispatch({ type: 'pause', now: now() }),
      adjust: (blockId, deltaMin) => dispatch({ type: 'adjust', blockId, deltaMin, now: now() }),
      setValidated: (blockId, value) => dispatch({ type: 'setValidated', blockId, value, now: now() }),
      markNotified: (blockId) => dispatch({ type: 'notified', blockId, now: now() }),
      addBlock: (block) => dispatch({ type: 'addBlock', block, now: now() }),
      updateBlock: (block) => dispatch({ type: 'updateBlock', block, now: now() }),
      deleteBlock: (blockId) => dispatch({ type: 'deleteBlock', blockId, now: now() }),
      moveBlock: (blockId, direction) => dispatch({ type: 'moveBlock', blockId, direction, now: now() }),
      saveTemplate: () => dispatch({ type: 'saveTemplate', now: now() }),
      applyTemplate: () => dispatch({ type: 'applyTemplate', now: now() }),
    }
  }, [])

  const store = useMemo(() => ({ state, actions }), [state, actions])
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
