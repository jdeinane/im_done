import { describe, expect, it } from 'vitest'
import { createDay } from './dayRollover'
import { at, MIN, stateAt, template } from './fixtures'
import { mergeStates } from './merge'
import type { AppState, Block, Day } from './types'

const t0 = at(2026, 10, 19, 9)
const today = '2026-10-19'

const withDay = (state: AppState, patch: (day: Day) => Day): AppState => ({
  ...state,
  days: { ...state.days, [today]: patch(state.days[today]) },
})
const withTime = (min: number, updatedAt: number) => (day: Day): Day => ({
  ...day,
  updatedAt,
  progress: { ...day.progress, leet: { ...day.progress.leet, accumulatedMs: min * MIN } },
})

describe('mergeStates', () => {
  it('garde le jour le plus récemment modifié', () => {
    const local = withDay(stateAt(t0), withTime(10, 100))
    const remote = withDay(stateAt(t0), withTime(50, 200))
    expect(mergeStates(local, remote).days[today].progress.leet.accumulatedMs).toBe(50 * MIN)
    expect(mergeStates(remote, local).days[today].progress.leet.accumulatedMs).toBe(50 * MIN)
  })

  it('renvoie le même objet quand le local est déjà à jour', () => {
    const local = withDay(stateAt(t0), withTime(50, 200))
    const remote = withDay(stateAt(t0), withTime(10, 100))
    expect(mergeStates(local, remote)).toBe(local)
    expect(mergeStates(local, structuredClone(local))).toBe(local)
  })

  it('fait l’union des jours', () => {
    const local = stateAt(at(2026, 10, 18, 9))
    const remote = stateAt(t0)
    expect(Object.keys(mergeStates(local, remote).days).sort()).toEqual(['2026-10-18', '2026-10-19'])
  })

  it('un jour vierge créé sur un nouvel appareil ne remplace pas des données existantes', () => {
    const fresh = stateAt(t0) // jour du modèle, jamais modifié (updatedAt absent)
    const legacy = withDay(stateAt(t0), (d) => withTime(30, 0)(d)) // ancien jour sans horodatage mais rempli
    expect(mergeStates(fresh, legacy).days[today].progress.leet.accumulatedMs).toBe(30 * MIN)
  })

  it('à égalité totale, le local gagne', () => {
    const local = withDay(stateAt(t0), withTime(10, 100))
    const remote = withDay(stateAt(t0), withTime(10, 100))
    expect(mergeStates(local, remote)).toBe(local)
  })

  it('le modèle le plus récent gagne', () => {
    const read: Block = { id: 'read', name: 'Lecture', emoji: '📚', color: '#10b981', targetMin: 60 }
    const local = { ...stateAt(t0), templateUpdatedAt: 100 }
    const remote = { ...stateAt(t0), template: [read], templateUpdatedAt: 200 }
    expect(mergeStates(local, remote).template).toEqual([read])
    expect(mergeStates(remote, local).template).toEqual([read])
    expect(mergeStates(local, { ...remote, templateUpdatedAt: 50 }).template).toEqual(template)
  })

  it('reprend le chrono en cours de l’autre appareil', () => {
    const local = stateAt(t0)
    const remote = withDay(stateAt(t0), (d) => ({
      ...d,
      updatedAt: 500,
      progress: { ...d.progress, gym: { ...d.progress.gym, runningSince: t0 } },
    }))
    const merged = mergeStates(local, remote)
    expect(merged.activeBlockId).toBe('gym')
    expect(merged.days[today].progress.gym.runningSince).toBe(t0)
  })

  it('l’autre appareil a mis le chrono en pause : plus de bloc actif', () => {
    const running = withDay(stateAt(t0), (d) => ({
      ...d,
      updatedAt: 100,
      progress: { ...d.progress, gym: { ...d.progress.gym, runningSince: t0 } },
    }))
    const local: AppState = { ...running, activeBlockId: 'gym' }
    const remote = withDay(stateAt(t0), (d) => ({ ...createDay(today, template), updatedAt: 200, progress: d.progress }))
    expect(mergeStates(local, remote).activeBlockId).toBeNull()
  })
})
