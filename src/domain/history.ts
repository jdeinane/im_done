import { addDays } from './dates'
import { dayTotals, isBlockDone, isDayComplete, progressRatio } from './progress'
import type { Day } from './types'

export interface BlockSummary {
  blockId: string
  name: string
  emoji: string
  color: string
  ratio: number
  done: boolean
}

export interface DaySummary {
  date: string
  /** false si aucun jour n'a été enregistré à cette date. */
  hasData: boolean
  ratio: number
  complete: boolean
  blocks: BlockSummary[]
}

/** Les n derniers jours, du plus ancien au plus récent (aujourd'hui inclus). */
export function lastDays(days: Record<string, Day>, today: string, n: number, now: number): DaySummary[] {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - (n - 1))
    const day = days[date]
    if (!day) return { date, hasData: false, ratio: 0, complete: false, blocks: [] }
    return {
      date,
      hasData: true,
      ratio: dayTotals(day, now).ratio,
      complete: isDayComplete(day, now),
      blocks: day.blocks.map((b) => {
        const p = day.progress[b.id]
        return {
          blockId: b.id,
          name: b.name,
          emoji: b.emoji,
          color: b.color,
          ratio: p ? progressRatio(b, p, now) : 0,
          done: p ? isBlockDone(b, p, now) : false,
        }
      }),
    }
  })
}

/**
 * Jours consécutifs où tous les blocs sont validés.
 * Aujourd'hui compte s'il est complet ; sinon on part d'hier (la journée n'est pas finie).
 */
export function currentStreak(days: Record<string, Day>, today: string, now: number): number {
  let streak = 0
  let date = today
  const maxSteps = Object.keys(days).length + 1
  for (let i = 0; i < maxSteps; i++) {
    const day = days[date]
    if (day && isDayComplete(day, now)) streak++
    else if (date !== today) break
    date = addDays(date, -1)
  }
  return streak
}

export interface BlockRow {
  blockId: string
  name: string
  emoji: string
  color: string
  /** Une cellule par jour, dans l'ordre de `summaries` ; null si le bloc n'existait pas ce jour-là. */
  cells: (BlockSummary | null)[]
}

/**
 * Regroupe les blocs de la période en lignes (une par bloc), pour une grille bloc × jour.
 * L'ordre suit le jour le plus récent, puis les blocs disparus du modèle.
 */
export function blockRows(summaries: DaySummary[]): BlockRow[] {
  const rows = new Map<string, BlockRow>()
  for (const summary of [...summaries].reverse()) {
    for (const b of summary.blocks) {
      if (!rows.has(b.blockId)) {
        rows.set(b.blockId, { blockId: b.blockId, name: b.name, emoji: b.emoji, color: b.color, cells: [] })
      }
    }
  }
  return [...rows.values()].map((row) => ({
    ...row,
    cells: summaries.map((s) => s.blocks.find((b) => b.blockId === row.blockId) ?? null),
  }))
}
