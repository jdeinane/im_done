import { rolloverToToday } from '../domain/dayRollover'
import { toDateKey } from '../domain/dates'
import { mergeStates } from '../domain/merge'
import { isBlockDone } from '../domain/progress'
import { pauseActive, startBlock } from '../domain/sessions'
import { adjustMinutes, emptyProgress } from '../domain/timer'
import type { AppState, Block, Day } from '../domain/types'

/** Toutes les actions portent `now` pour que le reducer reste pur et testable. */
export type Action =
  | { type: 'tick'; now: number }
  | { type: 'hydrate'; state: AppState; now: number }
  /** État reçu d'un autre appareil : fusionné jour par jour (cf. domain/merge). */
  | { type: 'mergeRemote'; state: AppState; now: number }
  | { type: 'start'; blockId: string; now: number }
  | { type: 'pause'; now: number }
  | { type: 'adjust'; blockId: string; deltaMin: number; now: number }
  | { type: 'setValidated'; blockId: string; value: boolean; now: number }
  /** Le feedback d'auto-validation a été joué : ne plus le rejouer. */
  | { type: 'notified'; blockId: string; now: number }
  | { type: 'addBlock'; block: Block; now: number }
  | { type: 'updateBlock'; block: Block; now: number }
  | { type: 'deleteBlock'; blockId: string; now: number }
  | { type: 'moveBlock'; blockId: string; direction: -1 | 1; now: number }
  | { type: 'saveTemplate'; now: number }
  | { type: 'applyTemplate'; now: number }

function updateToday(state: AppState, now: number, fn: (day: Day) => Day): AppState {
  const key = toDateKey(now)
  const day = state.days[key]
  return day ? { ...state, days: { ...state.days, [key]: fn(day) } } : state
}

function withProgress(day: Day, blockId: string, fn: (p: Day['progress'][string]) => Day['progress'][string]): Day {
  const p = day.progress[blockId]
  return p ? { ...day, progress: { ...day.progress, [blockId]: fn(p) } } : day
}

function apply(state: AppState, action: Action): AppState {
  const { now } = action
  switch (action.type) {
    case 'tick':
      return state
    case 'hydrate':
      return action.state
    case 'mergeRemote':
      return mergeStates(state, action.state)
    case 'start':
      return startBlock(state, action.blockId, now)
    case 'pause':
      return pauseActive(state, now)
    case 'adjust':
      return updateToday(state, now, (day) => {
        const block = day.blocks.find((b) => b.id === action.blockId)
        return withProgress(day, action.blockId, (p) => {
          const adjusted = adjustMinutes(p, action.deltaMin, now)
          // Repassé sous la cible : l'auto-validation pourra se redéclencher à la prochaine fois.
          const reopened = block && !adjusted.manuallyValidated && !isBlockDone(block, adjusted, now)
          return reopened ? { ...adjusted, validatedAt: null } : adjusted
        })
      })
    case 'setValidated':
      return updateToday(state, now, (day) =>
        withProgress(day, action.blockId, (p) => ({
          ...p,
          manuallyValidated: action.value,
          // Validé à la main : pas de feedback d'auto-validation derrière.
          validatedAt: action.value ? (p.validatedAt ?? now) : null,
        })),
      )
    case 'notified':
      return updateToday(state, now, (day) =>
        withProgress(day, action.blockId, (p) => ({ ...p, validatedAt: p.validatedAt ?? now })),
      )
    case 'addBlock':
      return updateToday(state, now, (day) =>
        day.progress[action.block.id]
          ? day
          : {
              ...day,
              blocks: [...day.blocks, action.block],
              progress: { ...day.progress, [action.block.id]: emptyProgress(action.block.id) },
            },
      )
    case 'updateBlock':
      return updateToday(state, now, (day) => ({
        ...day,
        blocks: day.blocks.map((b) => (b.id === action.block.id ? action.block : b)),
      }))
    case 'deleteBlock': {
      const stopped = state.activeBlockId === action.blockId ? pauseActive(state, now) : state
      return updateToday(stopped, now, (day) => {
        const { [action.blockId]: _removed, ...progress } = day.progress
        return { ...day, blocks: day.blocks.filter((b) => b.id !== action.blockId), progress }
      })
    }
    case 'moveBlock':
      return updateToday(state, now, (day) => {
        const from = day.blocks.findIndex((b) => b.id === action.blockId)
        const to = from + action.direction
        if (from < 0 || to < 0 || to >= day.blocks.length) return day
        const blocks = [...day.blocks]
        ;[blocks[from], blocks[to]] = [blocks[to], blocks[from]]
        return { ...day, blocks }
      })
    case 'saveTemplate': {
      const day = state.days[toDateKey(now)]
      return day ? { ...state, template: day.blocks.map((b) => ({ ...b })), templateUpdatedAt: now } : state
    }
    case 'applyTemplate': {
      const { template } = state
      const stopped = template.some((b) => b.id === state.activeBlockId) ? state : pauseActive(state, now)
      return updateToday(stopped, now, (day) => ({
        ...day,
        blocks: template.map((b) => ({ ...b })),
        progress: Object.fromEntries(template.map((b) => [b.id, day.progress[b.id] ?? emptyProgress(b.id)])),
      }))
    }
  }
}

/** Horodate les jours modifiés par une action (comparaison par référence avec l'état d'avant). */
function stampChangedDays(before: AppState, after: AppState, now: number): AppState {
  if (before.days === after.days) return after
  const days = { ...after.days }
  for (const [date, day] of Object.entries(days)) {
    if (day !== before.days[date]) days[date] = { ...day, updatedAt: now }
  }
  return { ...after, days }
}

export function reducer(state: AppState, action: Action): AppState {
  // Les états importés d'un autre appareil gardent leurs propres horodatages.
  if (action.type === 'hydrate' || action.type === 'mergeRemote') {
    return rolloverToToday(apply(state, action), action.now)
  }
  // Chaque action part d'un état à jour : changement de jour et chrono figé à minuit.
  const rolled = rolloverToToday(state, action.now)
  return stampChangedDays(rolled, apply(rolled, action), action.now)
}
