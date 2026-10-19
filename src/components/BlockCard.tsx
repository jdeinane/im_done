import { blockStatus, overtimeMs, progressRatio, type BlockStatus } from '../domain/progress'
import { elapsedMs } from '../domain/timer'
import type { Block, BlockProgress } from '../domain/types'
import { formatClock, formatDuration, formatOvertime } from '../lib/format'
import { ProgressBar } from './ProgressBar'

const STATUS_LABEL: Record<BlockStatus, string> = {
  todo: 'À faire',
  running: 'En cours',
  done: 'Validé',
}

interface Props {
  block: Block
  progress: BlockProgress
  now: number
  celebrating: boolean
  onStart(): void
  onPause(): void
}

export function BlockCard({ block, progress, now, celebrating, onStart, onPause }: Props) {
  const status = blockStatus(block, progress, now)
  const running = progress.runningSince !== null
  const overtime = overtimeMs(block, progress, now)

  return (
    <li
      className={`card card--${status}${celebrating ? ' card--celebrate' : ''}`}
      style={{ '--block-color': block.color } as React.CSSProperties}>
      <div className="card__head">
        <span className="card__emoji" aria-hidden="true">
          {block.emoji}
        </span>
        <div className="card__title">
          <h2>{block.name}</h2>
          <p>
            <span className="clock">{formatClock(elapsedMs(progress, now))}</span>
            {' / '}
            {formatDuration(block.targetMin)}
            {overtime > 0 && <strong className="overtime"> {formatOvertime(overtime)}</strong>}
          </p>
        </div>
        <span className={`badge badge--${status}`}>{STATUS_LABEL[status]}</span>
        <button
          type="button"
          className="btn btn--primary"
          aria-pressed={running}
          aria-label={`${running ? 'Pause' : 'Démarrer'} ${block.name}`}
          onClick={running ? onPause : onStart}
        >
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
      </div>
      <ProgressBar
        ratio={progressRatio(block, progress, now)}
        label={`Progression ${block.name}`}
        color={block.color}
        done={status === 'done'}
      />
    </li>
  )
}
