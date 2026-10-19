import { useEffect, useRef, useState } from 'react'
import { pendingValidations } from '../domain/validation'
import type { Day } from '../domain/types'
import { showNotification } from '../lib/notify'
import { playChime } from '../lib/sound'
import type { Prefs } from '../storage/prefs'

const CELEBRATION_MS = 3000

/**
 * Détecte les blocs qui viennent d'atteindre 100 % et joue le feedback une seule fois :
 * persiste `validatedAt` (via markNotified), puis son / notification selon les préférences.
 * Retourne les ids à mettre en avant visuellement pendant quelques secondes.
 */
export function useAutoValidate(
  day: Day | undefined,
  now: number,
  prefs: Prefs,
  markNotified: (blockId: string) => void,
): ReadonlySet<string> {
  const [celebrating, setCelebrating] = useState<ReadonlySet<string>>(new Set())
  // Garde contre le double effet de StrictMode : l'état persisté n'est pas encore à jour.
  const fired = useRef(new Set<string>())

  useEffect(() => {
    if (!day) return
    // Une fois validatedAt persisté, la garde n'a plus lieu d'être (et un bloc rouvert pourra re-déclencher).
    for (const [id, p] of Object.entries(day.progress)) {
      if (p.validatedAt !== null) fired.current.delete(`${day.date}:${id}`)
    }
    const pending = pendingValidations(day, now).filter((b) => !fired.current.has(`${day.date}:${b.id}`))
    if (pending.length === 0) return

    for (const block of pending) {
      fired.current.add(`${day.date}:${block.id}`)
      markNotified(block.id)
      if (prefs.notifications) {
        showNotification(`${block.emoji} ${block.name} validé !`, 'Objectif du bloc atteint.', block.id)
      }
    }
    if (prefs.sound) playChime()

    const ids = pending.map((b) => b.id)
    setCelebrating((prev) => new Set([...prev, ...ids]))
    window.setTimeout(
      () => setCelebrating((prev) => new Set([...prev].filter((id) => !ids.includes(id)))),
      CELEBRATION_MS,
    )
  }, [day, now, prefs, markNotified])

  return celebrating
}
