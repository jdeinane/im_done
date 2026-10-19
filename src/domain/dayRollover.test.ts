import { describe, expect, it } from 'vitest'
import { createDay, rolloverToToday } from './dayRollover'
import { at, MIN, stateAt } from './fixtures'
import { startBlock } from './sessions'
import { elapsedMs } from './timer'

describe('rolloverToToday', () => {
  it('ne change rien si le jour courant existe déjà', () => {
    const now = at(2026, 10, 19, 9)
    const s = stateAt(now)
    expect(rolloverToToday(s, now)).toBe(s)
  })

  it('crée le nouveau jour depuis le modèle, compteurs à zéro', () => {
    const yesterday = at(2026, 10, 18, 9)
    let s = startBlock(stateAt(yesterday), 'leet', yesterday)
    s = { ...s, activeBlockId: null }
    s.days['2026-10-18'].progress.leet = { ...s.days['2026-10-18'].progress.leet, runningSince: null, accumulatedMs: 99 * MIN }

    const next = rolloverToToday(s, at(2026, 10, 19, 8))
    const day = next.days['2026-10-19']
    expect(day.blocks.map((b) => b.id)).toEqual(['leet', 'gym'])
    expect(elapsedMs(day.progress.leet, at(2026, 10, 19, 8))).toBe(0)
    // Le jour passé garde ses données.
    expect(next.days['2026-10-18'].progress.leet.accumulatedMs).toBe(99 * MIN)
  })

  it('fige à minuit le chrono resté actif sur la veille', () => {
    const evening = at(2026, 10, 18, 23, 30)
    const s = startBlock(stateAt(evening), 'leet', evening)

    // Réouverture le lendemain à 8 h : seules 30 min comptent pour la veille.
    const next = rolloverToToday(s, at(2026, 10, 19, 8))
    const old = next.days['2026-10-18'].progress.leet
    expect(old.runningSince).toBeNull()
    expect(old.accumulatedMs).toBe(30 * MIN)
    expect(next.activeBlockId).toBeNull()
    expect(next.days['2026-10-19'].progress.leet.runningSince).toBeNull()
  })

  it('applique le modèle courant, sans toucher aux jours passés', () => {
    const now = at(2026, 10, 19, 9)
    const s = stateAt(at(2026, 10, 18, 9))
    const changed = {
      ...s,
      template: [{ id: 'read', name: 'Lecture', emoji: '📚', color: '#10b981', targetMin: 60 }],
    }
    const next = rolloverToToday(changed, now)
    expect(next.days['2026-10-19'].blocks.map((b) => b.id)).toEqual(['read'])
    expect(next.days['2026-10-18'].blocks.map((b) => b.id)).toEqual(['leet', 'gym'])
  })

  it('createDay copie les blocs du modèle (pas de référence partagée)', () => {
    const tpl = stateAt(0).template
    const day = createDay('2026-10-19', tpl)
    day.blocks[0].targetMin = 1
    expect(tpl[0].targetMin).toBe(120)
  })
})
