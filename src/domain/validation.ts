import { isBlockDone } from './progress'
import type { Block, Day } from './types'

/**
 * Blocs qui viennent d'atteindre leur cible au chrono (ou par ajustement) et dont le feedback
 * n'a pas encore été joué. Une validation manuelle ne déclenche rien (validatedAt déjà posé).
 */
export function pendingValidations(day: Day, now: number): Block[] {
  return day.blocks.filter((block) => {
    const p = day.progress[block.id]
    return p !== undefined && !p.manuallyValidated && p.validatedAt === null && isBlockDone(block, p, now)
  })
}
