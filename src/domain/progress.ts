import { elapsedMs, MINUTE_MS } from './timer'
import type { Block, BlockProgress, Day } from './types'

export type BlockStatus = 'todo' | 'running' | 'done'

export function targetMs(block: Block): number {
  return block.targetMin * MINUTE_MS
}

export function isBlockDone(block: Block, p: BlockProgress, now: number): boolean {
  return p.manuallyValidated || elapsedMs(p, now) >= targetMs(block)
}

/** « Validé » prime sur « en cours » : un bloc en dépassement reste validé. */
export function blockStatus(block: Block, p: BlockProgress, now: number): BlockStatus {
  if (isBlockDone(block, p, now)) return 'done'
  return p.runningSince === null ? 'todo' : 'running'
}

/** Ratio d'avancement plafonné à 1. */
export function progressRatio(block: Block, p: BlockProgress, now: number): number {
  if (isBlockDone(block, p, now)) return 1
  return Math.min(1, elapsedMs(p, now) / targetMs(block))
}

/** Temps au-delà de la cible (affiché « +mm:ss »). */
export function overtimeMs(block: Block, p: BlockProgress, now: number): number {
  return Math.max(0, elapsedMs(p, now) - targetMs(block))
}

export interface DayTotals {
  accomplishedMs: number
  targetMs: number
  ratio: number
}

/** Le dépassement d'un bloc ne compense pas les autres : chaque bloc est plafonné à sa cible. */
export function dayTotals(day: Day, now: number): DayTotals {
  let accomplished = 0
  let target = 0
  for (const block of day.blocks) {
    const p = day.progress[block.id]
    target += targetMs(block)
    if (p) accomplished += progressRatio(block, p, now) * targetMs(block)
  }
  return { accomplishedMs: accomplished, targetMs: target, ratio: target > 0 ? accomplished / target : 0 }
}

/** Un jour sans bloc n'est jamais « complet ». */
export function isDayComplete(day: Day, now: number): boolean {
  return (
    day.blocks.length > 0 &&
    day.blocks.every((b) => {
      const p = day.progress[b.id]
      return p !== undefined && isBlockDone(b, p, now)
    })
  )
}
