import { describe, expect, it } from 'vitest'
import { stateAt, at } from '../domain/fixtures'
import { loadState, saveState, STORAGE_KEY, type StorageLike } from './localStorage'

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v
    },
  }
}

const state = stateAt(at(2026, 10, 19, 9))

describe('storage', () => {
  it('sauvegarde puis recharge le même état', () => {
    const storage = memoryStorage()
    saveState(storage, state)
    expect(loadState(storage)).toEqual(state)
  })

  it('renvoie null si rien n’est sauvegardé ou sans stockage', () => {
    expect(loadState(memoryStorage())).toBeNull()
    expect(loadState(null)).toBeNull()
  })

  it('ignore un JSON corrompu', () => {
    expect(loadState(memoryStorage({ [STORAGE_KEY]: '{oups' }))).toBeNull()
  })

  it('ignore un schéma inconnu ou une forme invalide', () => {
    const future = JSON.stringify({ ...state, schemaVersion: 2 })
    expect(loadState(memoryStorage({ [STORAGE_KEY]: future }))).toBeNull()
    const broken = JSON.stringify({ ...state, days: { x: { date: 'x' } } })
    expect(loadState(memoryStorage({ [STORAGE_KEY]: broken }))).toBeNull()
  })

  it('ne plante pas si l’écriture échoue (quota, mode privé)', () => {
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(() => saveState(failing, state)).not.toThrow()
    expect(() => saveState(null, state)).not.toThrow()
  })
})
