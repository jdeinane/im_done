import { describe, expect, it } from 'vitest'
import { createDay } from './dayRollover'
import { at, MIN, template } from './fixtures'
import { adjustMinutes, startTimer } from './timer'
import { pendingValidations } from './validation'

const now = at(2026, 10, 19, 9)
const ids = (day: ReturnType<typeof createDay>, t: number) => pendingValidations(day, t).map((b) => b.id)

describe('pendingValidations', () => {
  it('ne renvoie rien tant que la cible n’est pas atteinte', () => {
    const day = createDay('2026-10-19', template)
    day.progress.leet = startTimer(day.progress.leet, now)
    expect(ids(day, now + 119 * MIN)).toEqual([])
  })

  it('renvoie le bloc dès que la cible est atteinte au chrono', () => {
    const day = createDay('2026-10-19', template)
    day.progress.leet = startTimer(day.progress.leet, now)
    expect(ids(day, now + 120 * MIN)).toEqual(['leet'])
  })

  it('renvoie aussi un bloc validé par ajustement de minutes', () => {
    const day = createDay('2026-10-19', template)
    day.progress.gym = adjustMinutes(day.progress.gym, 80, now)
    expect(ids(day, now)).toEqual(['gym'])
  })

  it('ne renvoie plus un bloc déjà notifié', () => {
    const day = createDay('2026-10-19', template)
    day.progress.leet = { ...adjustMinutes(day.progress.leet, 120, now), validatedAt: now }
    expect(ids(day, now)).toEqual([])
  })

  it('ignore la validation manuelle', () => {
    const day = createDay('2026-10-19', template)
    day.progress.leet = { ...day.progress.leet, manuallyValidated: true }
    expect(ids(day, now)).toEqual([])
  })
})
