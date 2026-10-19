import type { AppState, Day } from './types'

/** Quantité de données saisies sur un jour : un jour vierge (créé depuis le modèle) vaut 0. */
function activityScore(day: Day): number {
  return Object.values(day.progress).reduce(
    (sum, p) =>
      sum +
      p.accumulatedMs +
      Math.abs(p.manualAdjustMs) +
      (p.runningSince !== null ? 1 : 0) +
      (p.manuallyValidated ? 1 : 0),
    0,
  )
}

/** Vrai si `remote` doit remplacer `local` : le plus récent gagne, puis le plus rempli ; à égalité, le local. */
function remoteWins(local: Day, remote: Day): boolean {
  const l = local.updatedAt ?? 0
  const r = remote.updatedAt ?? 0
  if (l !== r) return r > l
  return activityScore(remote) > activityScore(local)
}

/** Le chrono en cours : le plus récemment démarré, dans le jour le plus récent qui en a un. */
function findActiveBlockId(days: Record<string, Day>): string | null {
  for (const date of Object.keys(days).sort().reverse()) {
    const running = Object.values(days[date].progress)
      .filter((p) => p.runningSince !== null)
      .sort((a, b) => (b.runningSince ?? 0) - (a.runningSince ?? 0))
    if (running.length > 0) return running[0].blockId
  }
  return null
}

/**
 * Fusionne l'état d'un autre appareil : jour par jour, le plus récemment modifié gagne ;
 * le modèle suit le même principe. Renvoie `local` (même référence) s'il n'y a rien à changer,
 * ce qui évite les boucles de synchronisation.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  let days = local.days
  for (const [date, remoteDay] of Object.entries(remote.days)) {
    const localDay = local.days[date]
    if (!localDay || remoteWins(localDay, remoteDay)) {
      if (days === local.days) days = { ...local.days }
      days[date] = remoteDay
    }
  }

  const remoteTemplateWins = (remote.templateUpdatedAt ?? 0) > (local.templateUpdatedAt ?? 0)
  const template = remoteTemplateWins ? remote.template : local.template
  const templateUpdatedAt = remoteTemplateWins ? remote.templateUpdatedAt : local.templateUpdatedAt

  if (days === local.days && !remoteTemplateWins) return local

  return {
    ...local,
    template,
    templateUpdatedAt,
    days,
    activeBlockId: findActiveBlockId(days),
  }
}
