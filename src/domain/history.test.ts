import { describe, expect, it } from 'vitest'
import { createDay } from './dayRollover'
import { addDays } from './dates'
import { at, gym, leet, template } from './fixtures'
import { blockRows, currentStreak, lastDays } from './history'
import type { Day } from './types'

const now = at(2026, 10, 19, 12)
const today = '2026-10-19'

const complete = (date: string): Day => {
  const day = createDay(date, template)
  for (const id of Object.keys(day.progress)) day.progress[id].manuallyValidated = true
  return day
}
const partial = (date: string): Day => {
  const day = createDay(date, template)
  day.progress.leet.manuallyValidated = true
  return day
}
const byDate = (...ds: Day[]) => Object.fromEntries(ds.map((d) => [d.date, d]))

describe('addDays', () => {
  it('traverse les fins de mois et d’année', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('lastDays', () => {
  it('renvoie 7 jours du plus ancien à aujourd’hui, avec les jours manquants vides', () => {
    const out = lastDays(byDate(complete(today), partial('2026-10-18')), today, 7, now)
    expect(out).toHaveLength(7)
    expect(out[0].date).toBe('2026-10-13')
    expect(out[6].date).toBe(today)
    expect(out[0].hasData).toBe(false)
    expect(out[6]).toMatchObject({ hasData: true, ratio: 1, complete: true })
  })

  it('détaille le taux par bloc', () => {
    const [, ...rest] = lastDays(byDate(partial('2026-10-18')), today, 7, now)
    const yesterday = rest[4]
    expect(yesterday.date).toBe('2026-10-18')
    expect(yesterday.complete).toBe(false)
    expect(yesterday.ratio).toBeCloseTo(leet.targetMin / (leet.targetMin + gym.targetMin))
    expect(yesterday.blocks.map((b) => [b.blockId, b.done])).toEqual([
      ['leet', true],
      ['gym', false],
    ])
  })
})

describe('currentStreak', () => {
  it('compte les jours complets consécutifs, aujourd’hui inclus', () => {
    const days = byDate(complete(today), complete('2026-10-18'), complete('2026-10-17'))
    expect(currentStreak(days, today, now)).toBe(3)
  })

  it('ne casse pas la série si aujourd’hui n’est pas encore fini', () => {
    const days = byDate(partial(today), complete('2026-10-18'), complete('2026-10-17'))
    expect(currentStreak(days, today, now)).toBe(2)
  })

  it('s’arrête au premier jour incomplet ou manquant', () => {
    const incomplete = byDate(complete(today), partial('2026-10-18'), complete('2026-10-17'))
    expect(currentStreak(incomplete, today, now)).toBe(1)
    const missing = byDate(complete(today), complete('2026-10-17'))
    expect(currentStreak(missing, today, now)).toBe(1)
  })

  it('vaut 0 sans historique', () => {
    expect(currentStreak({}, today, now)).toBe(0)
  })
})

describe('blockRows', () => {
  it('construit une grille bloc × jour, null quand le bloc n’existait pas', () => {
    const old = createDay('2026-10-18', [leet])
    const days = byDate(old, partial(today))
    const rows = blockRows(lastDays(days, today, 2, now))

    expect(rows.map((r) => r.blockId)).toEqual(['leet', 'gym'])
    expect(rows[0].cells.map((c) => c?.done)).toEqual([false, true])
    expect(rows[1].cells[0]).toBeNull()
    expect(rows[1].cells[1]?.done).toBe(false)
  })

  it('garde les jours sans donnée comme cellules vides', () => {
    const rows = blockRows(lastDays(byDate(complete(today)), today, 3, now))
    expect(rows[0].cells.map((c) => c === null)).toEqual([true, true, false])
  })
})
