import { describe, expect, it } from 'vitest'
import { at, gym, leet, MIN, stateAt } from '../domain/fixtures'
import { elapsedMs } from '../domain/timer'
import type { Block } from '../domain/types'
import { reducer, type Action } from './reducer'

const t0 = at(2026, 10, 19, 9)
const today = '2026-10-19'
const run = (state = stateAt(t0), ...actions: Action[]) => actions.reduce(reducer, state)
const read: Block = { id: 'read', name: 'Lecture', emoji: '📚', color: '#10b981', targetMin: 60 }

describe('reducer: chrono', () => {
  it('start / pause cumulent le temps via timestamps', () => {
    const s = run(
      stateAt(t0),
      { type: 'start', blockId: 'leet', now: t0 },
      { type: 'pause', now: t0 + 25 * MIN },
    )
    expect(elapsedMs(s.days[today].progress.leet, t0 + 999 * MIN)).toBe(25 * MIN)
  })

  it('un seul chrono actif à la fois', () => {
    const s = run(
      stateAt(t0),
      { type: 'start', blockId: 'leet', now: t0 },
      { type: 'start', blockId: 'gym', now: t0 + 10 * MIN },
    )
    expect(s.activeBlockId).toBe('gym')
    expect(s.days[today].progress.leet.runningSince).toBeNull()
  })

  it('le tick fige à minuit le chrono oublié la veille', () => {
    const evening = at(2026, 10, 18, 23, 50)
    const s = run(stateAt(evening), { type: 'start', blockId: 'leet', now: evening }, { type: 'tick', now: t0 })
    expect(s.activeBlockId).toBeNull()
    expect(elapsedMs(s.days['2026-10-18'].progress.leet, t0)).toBe(10 * MIN)
    expect(s.days[today]).toBeDefined()
  })
})

describe('reducer: ajustements et validation', () => {
  it('ajuste les minutes du jour courant', () => {
    const s = run(stateAt(t0), { type: 'adjust', blockId: 'leet', deltaMin: 15, now: t0 })
    expect(elapsedMs(s.days[today].progress.leet, t0)).toBe(15 * MIN)
  })

  it('validation manuelle : pas de feedback d’auto-validation derrière', () => {
    const s = run(stateAt(t0), { type: 'setValidated', blockId: 'leet', value: true, now: t0 })
    expect(s.days[today].progress.leet).toMatchObject({ manuallyValidated: true, validatedAt: t0 })
    const undone = run(s, { type: 'setValidated', blockId: 'leet', value: false, now: t0 + MIN })
    expect(undone.days[today].progress.leet).toMatchObject({ manuallyValidated: false, validatedAt: null })
  })

  it('repasser sous la cible par ajustement réarme l’auto-validation', () => {
    const s = run(
      stateAt(t0),
      { type: 'adjust', blockId: 'leet', deltaMin: 120, now: t0 },
      { type: 'notified', blockId: 'leet', now: t0 },
      { type: 'adjust', blockId: 'leet', deltaMin: -10, now: t0 + MIN },
    )
    expect(s.days[today].progress.leet.validatedAt).toBeNull()
  })

  it('un ajustement qui garde le bloc validé conserve validatedAt', () => {
    const s = run(
      stateAt(t0),
      { type: 'adjust', blockId: 'leet', deltaMin: 130, now: t0 },
      { type: 'notified', blockId: 'leet', now: t0 },
      { type: 'adjust', blockId: 'leet', deltaMin: -10, now: t0 + MIN },
    )
    expect(s.days[today].progress.leet.validatedAt).toBe(t0)
  })

  it('notified n’est enregistré qu’une fois', () => {
    const s = run(
      stateAt(t0),
      { type: 'notified', blockId: 'leet', now: t0 },
      { type: 'notified', blockId: 'leet', now: t0 + MIN },
    )
    expect(s.days[today].progress.leet.validatedAt).toBe(t0)
  })
})

describe('reducer: gestion des blocs', () => {
  it('ajoute, édite, réordonne et supprime un bloc du jour', () => {
    let s = run(stateAt(t0), { type: 'addBlock', block: read, now: t0 })
    expect(s.days[today].blocks.map((b) => b.id)).toEqual(['leet', 'gym', 'read'])

    s = run(s, { type: 'updateBlock', block: { ...read, targetMin: 90 }, now: t0 })
    expect(s.days[today].blocks[2].targetMin).toBe(90)

    s = run(s, { type: 'moveBlock', blockId: 'read', direction: -1, now: t0 })
    expect(s.days[today].blocks.map((b) => b.id)).toEqual(['leet', 'read', 'gym'])

    s = run(s, { type: 'deleteBlock', blockId: 'read', now: t0 })
    expect(s.days[today].blocks.map((b) => b.id)).toEqual(['leet', 'gym'])
    expect(s.days[today].progress.read).toBeUndefined()
  })

  it('ne déplace pas un bloc au-delà des bornes', () => {
    const s = stateAt(t0)
    expect(run(s, { type: 'moveBlock', blockId: 'leet', direction: -1, now: t0 }).days[today].blocks).toBe(
      s.days[today].blocks,
    )
  })

  it('ignore un ajout dont l’id existe déjà', () => {
    const s = stateAt(t0)
    expect(run(s, { type: 'addBlock', block: leet, now: t0 }).days[today]).toBe(s.days[today])
  })

  it('supprimer le bloc actif arrête le chrono', () => {
    const s = run(
      stateAt(t0),
      { type: 'start', blockId: 'leet', now: t0 },
      { type: 'deleteBlock', blockId: 'leet', now: t0 + MIN },
    )
    expect(s.activeBlockId).toBeNull()
    expect(s.days[today].blocks.map((b) => b.id)).toEqual(['gym'])
  })
})

describe('reducer: modèle de journée', () => {
  it('sauvegarde le jour courant comme modèle, appliqué au jour suivant', () => {
    let s = run(stateAt(t0), { type: 'addBlock', block: read, now: t0 }, { type: 'saveTemplate', now: t0 })
    s = run(s, { type: 'adjust', blockId: 'leet', deltaMin: 60, now: t0 })

    const tomorrow = at(2026, 10, 20, 8)
    s = run(s, { type: 'tick', now: tomorrow })
    const day = s.days['2026-10-20']
    expect(day.blocks.map((b) => b.id)).toEqual(['leet', 'gym', 'read'])
    expect(elapsedMs(day.progress.leet, tomorrow)).toBe(0)
  })

  it('applyTemplate remet les blocs du modèle en conservant la progression des blocs communs', () => {
    let s = run(
      stateAt(t0),
      { type: 'adjust', blockId: 'leet', deltaMin: 30, now: t0 },
      { type: 'addBlock', block: read, now: t0 },
      { type: 'deleteBlock', blockId: 'gym', now: t0 },
      { type: 'applyTemplate', now: t0 },
    )
    const day = s.days[today]
    expect(day.blocks.map((b) => b.id)).toEqual(['leet', 'gym'])
    expect(elapsedMs(day.progress.leet, t0)).toBe(30 * MIN)
    expect(elapsedMs(day.progress.gym, t0)).toBe(0)
    expect(gym.id in day.progress).toBe(true)
    s = run(s, { type: 'tick', now: t0 })
    expect(s.days[today].blocks).toHaveLength(2)
  })

  it('hydrate remplace l’état et applique le changement de jour', () => {
    const other = stateAt(at(2026, 10, 18, 9))
    const s = run(stateAt(t0), { type: 'hydrate', state: other, now: t0 })
    expect(Object.keys(s.days).sort()).toEqual(['2026-10-18', '2026-10-19'])
  })
})
