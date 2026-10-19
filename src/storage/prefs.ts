import type { StorageLike } from './localStorage'

export const PREFS_KEY = 'imdone:prefs'

/** Préférences d'appareil, séparées de l'état des journées. */
export interface Prefs {
  sound: boolean
  notifications: boolean
}

export const DEFAULT_PREFS: Prefs = { sound: false, notifications: false }

export function loadPrefs(storage: StorageLike | null): Prefs {
  if (!storage) return DEFAULT_PREFS
  try {
    const raw = storage.getItem(PREFS_KEY)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFS
    const p = parsed as Record<string, unknown>
    return {
      sound: p.sound === true,
      notifications: p.notifications === true,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(storage: StorageLike | null, prefs: Prefs): void {
  if (!storage) return
  try {
    storage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Stockage indisponible : les préférences ne durent que la session.
  }
}
