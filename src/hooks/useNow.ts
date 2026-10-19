import { useEffect, useState } from 'react'

/**
 * Horloge d'affichage : force un rendu chaque seconde.
 * Ce n'est jamais la source de vérité du temps (cf. domain/timer) : si les ticks
 * sont suspendus (onglet en veille), la valeur est recalée à la reprise.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const id = window.setInterval(refresh, intervalMs)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [intervalMs])

  return now
}
