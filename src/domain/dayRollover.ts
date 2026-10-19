import { startOfNextDay, toDateKey } from './dates'
import { emptyProgress, pauseTimer } from './timer'
import type { AppState, Block, Day } from './types'

export function createDay(date: string, template: Block[]): Day {
  return {
    date,
    blocks: template.map((b) => ({ ...b })),
    progress: Object.fromEntries(template.map((b) => [b.id, emptyProgress(b.id)])),
  }
}

/**
 * Prépare l'état pour le jour courant :
 * - fige à minuit tout chrono resté actif sur un jour passé ;
 * - crée le jour courant depuis le modèle s'il n'existe pas (compteurs à zéro).
 * Renvoie le même objet si rien ne change.
 */
export function rolloverToToday(state: AppState, now: number): AppState {
  const today = toDateKey(now)
  let days = state.days
  let activeBlockId = state.activeBlockId

  for (const [date, day] of Object.entries(state.days)) {
    if (date >= today) continue
    const cutoff = Math.min(now, startOfNextDay(date))
    const progress = { ...day.progress }
    let frozen = false
    for (const [id, p] of Object.entries(progress)) {
      if (p.runningSince === null) continue
      progress[id] = pauseTimer(p, cutoff)
      frozen = true
    }
    if (frozen) {
      days = { ...days, [date]: { ...day, progress, updatedAt: cutoff } }
      activeBlockId = null
    }
  }

  if (!days[today]) days = { ...days, [today]: createDay(today, state.template) }

  return days === state.days && activeBlockId === state.activeBlockId
    ? state
    : { ...state, days, activeBlockId }
}
