import { describe, expect, it } from 'vitest'
import { createDay } from './dayRollover'
import { at, gym, leet, MIN, template } from './fixtures'
import {
  blockStatus,
  dayTotals,
  isDayComplete,
  overtimeMs,
  progressRatio,
} from './progress'
import { adjustMinutes, emptyProgress, startTimer } from './timer'

const now = at(2026, 10, 19, 9)

describe('progress', () => {
  it('passe de à faire à en cours à validé', () => {
    const todo = emptyProgress('leet')
    expect(blockStatus(leet, todo, now)).toBe('todo')

    const running = startTimer(todo, now)
    expect(blockStatus(leet, running, now + 60 * MIN)).toBe('running')
    expect(blockStatus(leet, running, now + 120 * MIN)).toBe('done')
  })

  it('calcule le ratio, plafonné à 1', () => {
    const running = startTimer(emptyProgress('leet'), now)
    expect(progressRatio(leet, running, now + 30 * MIN)).toBeCloseTo(0.25)
    expect(progressRatio(leet, running, now + 300 * MIN)).toBe(1)
  })

  it('mesure le dépassement après la cible', () => {
    const running = startTimer(emptyProgress('leet'), now)
    expect(overtimeMs(leet, running, now + 119 * MIN)).toBe(0)
    expect(overtimeMs(leet, running, now + 125 * MIN)).toBe(5 * MIN)
    // Un bloc en dépassement reste validé, même s'il tourne encore.
    expect(blockStatus(leet, running, now + 125 * MIN)).toBe('done')
  })

  it('la validation manuelle valide sans temps accompli', () => {
    const p = { ...emptyProgress('leet'), manuallyValidated: true }
    expect(blockStatus(leet, p, now)).toBe('done')
    expect(progressRatio(leet, p, now)).toBe(1)
  })

  it('totalise la journée en plafonnant chaque bloc à sa cible', () => {
    const day = createDay('2026-10-19', template)
    day.progress.leet = adjustMinutes(day.progress.leet, 300, now) // très au-delà de 120
    day.progress.gym = adjustMinutes(day.progress.gym, 40, now) // moitié de 80
    const totals = dayTotals(day, now)
    expect(totals.targetMs).toBe(200 * MIN)
    expect(totals.accomplishedMs).toBe(160 * MIN)
    expect(totals.ratio).toBeCloseTo(0.8)
  })

  it('un jour n’est complet que si tous les blocs sont validés', () => {
    const day = createDay('2026-10-19', template)
    expect(isDayComplete(day, now)).toBe(false)
    day.progress.leet = { ...day.progress.leet, manuallyValidated: true }
    expect(isDayComplete(day, now)).toBe(false)
    day.progress.gym = adjustMinutes(day.progress.gym, gym.targetMin, now)
    expect(isDayComplete(day, now)).toBe(true)
  })

  it('un jour sans bloc n’est jamais complet', () => {
    expect(isDayComplete(createDay('2026-10-19', []), now)).toBe(false)
    expect(dayTotals(createDay('2026-10-19', []), now).ratio).toBe(0)
  })
})
