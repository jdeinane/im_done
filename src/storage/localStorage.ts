import type { AppState } from '../domain/types'

export const STORAGE_KEY = 'imdone:state'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** localStorage peut être absent ou lever (navigation privée, quota) : on dégrade sans planter. */
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

const isOptionalNumber = (v: unknown): boolean => v === undefined || typeof v === 'number'

function isBlock(v: unknown): boolean {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.emoji === 'string' &&
    typeof v.color === 'string' &&
    typeof v.targetMin === 'number'
  )
}

function isProgress(v: unknown): boolean {
  return (
    isRecord(v) &&
    typeof v.blockId === 'string' &&
    typeof v.accumulatedMs === 'number' &&
    (v.runningSince === null || typeof v.runningSince === 'number') &&
    typeof v.manualAdjustMs === 'number' &&
    typeof v.manuallyValidated === 'boolean' &&
    (v.validatedAt === null || typeof v.validatedAt === 'number')
  )
}

function isDay(v: unknown): boolean {
  return (
    isRecord(v) &&
    typeof v.date === 'string' &&
    isOptionalNumber(v.updatedAt) &&
    Array.isArray(v.blocks) &&
    v.blocks.every(isBlock) &&
    isRecord(v.progress) &&
    Object.values(v.progress).every(isProgress)
  )
}

/** Garde de type pour un état reçu du disque ou du réseau : on ne fait confiance à aucune donnée externe. */
export function isAppState(v: unknown): v is AppState {
  return (
    isRecord(v) &&
    v.schemaVersion === 1 &&
    isOptionalNumber(v.templateUpdatedAt) &&
    Array.isArray(v.template) &&
    v.template.every(isBlock) &&
    isRecord(v.days) &&
    Object.values(v.days).every(isDay) &&
    (v.activeBlockId === null || typeof v.activeBlockId === 'string')
  )
}

/** Renvoie l'état sauvegardé, ou null s'il est absent, illisible ou d'un schéma inconnu. */
export function loadState(storage: StorageLike | null): AppState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isAppState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveState(storage: StorageLike | null, state: AppState): void {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota dépassé ou stockage indisponible : l'app continue en mémoire.
  }
}
