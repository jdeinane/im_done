import type { Day } from '../domain/types'
import { useStore } from '../state/storeContext'
import { BlockCard } from './BlockCard'

interface Props {
  day: Day
  now: number
  celebrating: ReadonlySet<string>
}

export function BlockList({ day, now, celebrating }: Props) {
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
          celebrating={celebrating.has(block.id)}
          onStart={() => actions.start(block.id)}
          onPause={actions.pause}
        />
      ))}
    </ul>
  )
}
