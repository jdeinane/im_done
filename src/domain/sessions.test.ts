import { describe, expect, it } from 'vitest'
import { at, MIN, stateAt } from './fixtures'
import { elapsedMs } from './timer'
import { pauseActive, startBlock } from './sessions'

const t0 = at(2026, 10, 19, 9)
const today = '2026-10-19'

describe('sessions', () => {
  it('démarre un bloc et le déclare actif', () => {
    const s = startBlock(stateAt(t0), 'leet', t0)
    expect(s.activeBlockId).toBe('leet')
    expect(s.days[today].progress.leet.runningSince).toBe(t0)
  })

  it('démarrer un bloc met l’autre en pause en cumulant son temps', () => {
    let s = startBlock(stateAt(t0), 'leet', t0)
    s = startBlock(s, 'gym', t0 + 30 * MIN)

    const { leet, gym } = s.days[today].progress
    expect(s.activeBlockId).toBe('gym')
    expect(leet.runningSince).toBeNull()
    expect(elapsedMs(leet, t0 + 90 * MIN)).toBe(30 * MIN)
    expect(elapsedMs(gym, t0 + 90 * MIN)).toBe(60 * MIN)
  })

  it('met en pause le bloc actif', () => {
    let s = startBlock(stateAt(t0), 'leet', t0)
    s = pauseActive(s, t0 + 10 * MIN)
    expect(s.activeBlockId).toBeNull()
    expect(elapsedMs(s.days[today].progress.leet, t0 + 60 * MIN)).toBe(10 * MIN)
  })

  it('ignore un bloc inconnu', () => {
    const s = stateAt(t0)
    expect(startBlock(s, 'nope', t0)).toBe(s)
  })

  it('pause sans bloc actif ne change rien', () => {
    const s = stateAt(t0)
    expect(pauseActive(s, t0)).toBe(s)
  })
})
