/** Un bloc du modèle de journée (durée cible en minutes). */
export interface Block {
  id: string
  name: string
  emoji: string
  color: string
  targetMin: number
}

/**
 * Progression d'un bloc sur un jour donné.
 * Le temps n'est jamais compté par un compteur : il se déduit des timestamps.
 */
export interface BlockProgress {
  blockId: string
  /** Temps cumulé des sessions terminées (ms). */
  accumulatedMs: number
  /** Timestamp (ms) du dernier Start, null si le chrono est en pause. */
  runningSince: number | null
  /** Ajustements manuels ± (ms). */
  manualAdjustMs: number
  manuallyValidated: boolean
  /** Timestamp de la première validation notifiée, null tant que non notifiée. */
  validatedAt: number | null
}

export interface Day {
  /** Clé locale 'YYYY-MM-DD'. */
  date: string
  /** Snapshot du modèle au moment de la création du jour. */
  blocks: Block[]
  progress: Record<string, BlockProgress>
}

export interface AppState {
  schemaVersion: 1
  template: Block[]
  days: Record<string, Day>
  /** Bloc dont le chrono tourne (un seul à la fois), dans le jour courant. */
  activeBlockId: string | null
}
