import type { Day } from '../domain/types'
import { useStore } from '../state/storeContext'
import { BlockCard } from './BlockCard'

export function BlockList({ day, now }: { day: Day; now: number }) {
  const { actions } = useStore()

  if (day.blocks.length === 0) {
    return <p className="empty">Aucun bloc pour aujourd’hui.</p>
  }

  return (
    <ul className="list">
      {day.blocks.map((block) => (
        <BlockCard
          key={block.id}
          block={block}
          progress={day.progress[block.id]}
          now={now}
          onStart={() => actions.start(block.id)}
          onPause={actions.pause}
        />
      ))}
    </ul>
  )
}
