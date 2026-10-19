import { useCallback, useEffect, useState } from 'react'
import { browserStorage } from '../storage/localStorage'
import { loadPrefs, savePrefs, type Prefs } from '../storage/prefs'

export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const [prefs, setPrefs] = useState(() => loadPrefs(browserStorage()))
  useEffect(() => savePrefs(browserStorage(), prefs), [prefs])
  const update = useCallback((patch: Partial<Prefs>) => setPrefs((prev) => ({ ...prev, ...patch })), [])
  return [prefs, update]
}
