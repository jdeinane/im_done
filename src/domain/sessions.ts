import { toDateKey } from './dates'
import { pauseTimer, startTimer } from './timer'
import type { AppState } from './types'

/** Met en pause le chrono actif du jour courant, s'il y en a un. */
export function pauseActive(state: AppState, now: number): AppState {
  const { activeBlockId } = state
  const day = state.days[toDateKey(now)]
  if (!activeBlockId || !day?.progress[activeBlockId]) {
    return activeBlockId ? { ...state, activeBlockId: null } : state
  }
  const progress = { ...day.progress, [activeBlockId]: pauseTimer(day.progress[activeBlockId], now) }
  return { ...state, activeBlockId: null, days: { ...state.days, [day.date]: { ...day, progress } } }
}

/** Démarre un bloc ; un seul chrono est actif à la fois, l'éventuel autre est mis en pause. */
export function startBlock(state: AppState, blockId: string, now: number): AppState {
  const day = state.days[toDateKey(now)]
  if (!day?.progress[blockId]) return state
  const paused = pauseActive(state, now)
  const current = paused.days[day.date]
  const progress = { ...current.progress, [blockId]: startTimer(current.progress[blockId], now) }
  return {
    ...paused,
    activeBlockId: blockId,
    days: { ...paused.days, [day.date]: { ...current, progress } },
  }
}
