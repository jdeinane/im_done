import { createDay } from './dayRollover'
import { toDateKey } from './dates'
import { MINUTE_MS } from './timer'
import type { AppState, Block } from './types'

export const MIN = MINUTE_MS

/** Timestamp local : at(2026, 10, 19, 9, 30) = 19 oct. 2026 à 09:30. */
export const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0): number =>
  new Date(y, m - 1, d, h, min, s).getTime()

export const leet: Block = { id: 'leet', name: 'LeetCode', emoji: '🧩', color: '#6366f1', targetMin: 120 }
export const gym: Block = { id: 'gym', name: 'Muscu', emoji: '🏋️', color: '#ef4444', targetMin: 80 }
export const template: Block[] = [leet, gym]

/** État avec un jour créé pour `now` depuis le modèle par défaut. */
export function stateAt(now: number, tpl: Block[] = template): AppState {
  const date = toDateKey(now)
  return { schemaVersion: 1, template: tpl, days: { [date]: createDay(date, tpl) }, activeBlockId: null }
}
