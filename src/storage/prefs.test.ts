import { describe, expect, it } from 'vitest'
import type { StorageLike } from './localStorage'
import { DEFAULT_PREFS, loadPrefs, PREFS_KEY, savePrefs } from './prefs'

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const data = { ...initial }
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) }
}

describe('prefs', () => {
  it('sauvegarde puis recharge', () => {
    const storage = memoryStorage()
    savePrefs(storage, { sound: true, notifications: false })
    expect(loadPrefs(storage)).toEqual({ sound: true, notifications: false })
  })

  it('retombe sur les valeurs par défaut (son et notifications désactivés)', () => {
    expect(loadPrefs(memoryStorage())).toEqual(DEFAULT_PREFS)
    expect(loadPrefs(null)).toEqual(DEFAULT_PREFS)
    expect(loadPrefs(memoryStorage({ [PREFS_KEY]: '{oups' }))).toEqual(DEFAULT_PREFS)
    expect(loadPrefs(memoryStorage({ [PREFS_KEY]: '{"sound":"yes"}' }))).toEqual(DEFAULT_PREFS)
  })
})
