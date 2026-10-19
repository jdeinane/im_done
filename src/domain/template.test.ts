import { describe, expect, it } from 'vitest'
import { gym, leet } from './fixtures'
import { sameBlocks } from './template'

describe('sameBlocks', () => {
  it('reconnaît deux listes identiques', () => {
    expect(sameBlocks([leet, gym], [{ ...leet }, { ...gym }])).toBe(true)
    expect(sameBlocks([], [])).toBe(true)
  })

  it('détecte un changement d’ordre, de propriété ou de longueur', () => {
    expect(sameBlocks([leet, gym], [gym, leet])).toBe(false)
    expect(sameBlocks([leet], [{ ...leet, targetMin: 90 }])).toBe(false)
    expect(sameBlocks([leet], [leet, gym])).toBe(false)
  })
})
