import { createContext, useContext } from 'react'
import type { AppState, Block } from '../domain/types'

/** Les actions horodatent elles-mêmes (Date.now()) : les composants n'ont pas à s'en soucier. */
export interface Actions {
  tick(): void
  start(blockId: string): void
  pause(): void
  adjust(blockId: string, deltaMin: number): void
  setValidated(blockId: string, value: boolean): void
  markNotified(blockId: string): void
  addBlock(block: Block): void
  updateBlock(block: Block): void
  deleteBlock(blockId: string): void
  moveBlock(blockId: string, direction: -1 | 1): void
  saveTemplate(): void
  applyTemplate(): void
}

export interface Store {
  state: AppState
  actions: Actions
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore doit être utilisé dans <StoreProvider>')
  return store
}
