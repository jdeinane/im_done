import type { Block } from './types'

/** Même liste de blocs, dans le même ordre, avec les mêmes propriétés. */
export function sameBlocks(a: Block[], b: Block[]): boolean {
  return (
    a.length === b.length &&
    a.every((x, i) => {
      const y = b[i]
      return (
        x.id === y.id &&
        x.name === y.name &&
        x.emoji === y.emoji &&
        x.color === y.color &&
        x.targetMin === y.targetMin
      )
    })
  )
}
