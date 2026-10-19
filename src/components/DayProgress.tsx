import { dayTotals } from '../domain/progress'
import type { Day } from '../domain/types'
import { MINUTE_MS } from '../domain/timer'
import { formatDuration } from '../lib/format'
import { ProgressBar } from './ProgressBar'

export function DayProgress({ day, now }: { day: Day; now: number }) {
  const totals = dayTotals(day, now)
  const percent = Math.round(totals.ratio * 100)
  return (
    <section className="day" aria-label="Progression de la journée">
      <div className="day__figures">
        <strong>{percent} %</strong>
        <span>
          {formatDuration(Math.floor(totals.accomplishedMs / MINUTE_MS))} / {formatDuration(totals.targetMs / MINUTE_MS)}
        </span>
      </div>
      <ProgressBar ratio={totals.ratio} label="Progression de la journée" done={percent >= 100} />
    </section>
  )
}
