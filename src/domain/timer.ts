import type { BlockProgress } from './types'

export const MINUTE_MS = 60_000

export function emptyProgress(blockId: string): BlockProgress {
  return {
    blockId,
    accumulatedMs: 0,
    runningSince: null,
    manualAdjustMs: 0,
    manuallyValidated: false,
    validatedAt: null,
  }
}

function liveMs(p: BlockProgress, now: number): number {
  return p.runningSince === null ? 0 : Math.max(0, now - p.runningSince)
}

/** Temps accompli : dérivé des timestamps, donc insensible au rechargement et à la veille. */
export function elapsedMs(p: BlockProgress, now: number): number {
  return Math.max(0, p.accumulatedMs + p.manualAdjustMs + liveMs(p, now))
}

export function startTimer(p: BlockProgress, now: number): BlockProgress {
  return p.runningSince === null ? { ...p, runningSince: now } : p
}

export function pauseTimer(p: BlockProgress, now: number): BlockProgress {
  if (p.runningSince === null) return p
  return { ...p, accumulatedMs: p.accumulatedMs + liveMs(p, now), runningSince: null }
}

/** Ajoute ou retire des minutes, sans jamais passer sous zéro. */
export function adjustMinutes(p: BlockProgress, deltaMin: number, now: number): BlockProgress {
  const floor = -(p.accumulatedMs + liveMs(p, now))
  return { ...p, manualAdjustMs: Math.max(floor, p.manualAdjustMs + deltaMin * MINUTE_MS) }
}
