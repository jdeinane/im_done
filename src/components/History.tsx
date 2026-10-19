import { keyToDate } from '../domain/dates'
import { blockRows, currentStreak, lastDays, type BlockSummary } from '../domain/history'
import { useStore } from '../state/storeContext'

const DAYS_SHOWN = 7
const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' })

const percent = (ratio: number) => Math.round(ratio * 100)

function Cell({ summary }: { summary: BlockSummary | null }) {
  if (!summary) return <td className="grid__cell grid__cell--empty">–</td>
  const p = percent(summary.ratio)
  return (
    <td
      className={`grid__cell${summary.done ? ' grid__cell--done' : ''}`}
      style={{ '--r': p } as React.CSSProperties}
    >
      <span aria-hidden="true">{summary.done ? '✓' : `${p}`}</span>
      <span className="visually-hidden">{summary.done ? 'validé' : `${p} %`}</span>
    </td>
  )
}

export function History({ today, now }: { today: string; now: number }) {
  const { state } = useStore()
  const summaries = lastDays(state.days, today, DAYS_SHOWN, now)
  const rows = blockRows(summaries)
  const streak = currentStreak(state.days, today, now)

  return (
    <section className="history" aria-label="Historique des 7 derniers jours">
      <p className="streak">
        {streak > 0
          ? `🔥 ${streak} jour${streak > 1 ? 's' : ''} d’affilée avec tous les blocs validés`
          : 'Pas de série en cours : valide tous les blocs d’une journée pour la démarrer.'}
      </p>

      <div className="grid__scroll">
        <table className="grid">
          <caption className="visually-hidden">Taux de complétion par bloc et par jour, en pourcentage</caption>
          <thead>
            <tr>
              <th scope="col">Bloc</th>
              {summaries.map((s) => (
                <th key={s.date} scope="col" className={s.date === today ? 'grid__today' : undefined}>
                  {dayFormat.format(keyToDate(s.date))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.blockId}>
                <th scope="row" className="grid__block">
                  <span aria-hidden="true">{row.emoji}</span> {row.name}
                </th>
                {row.cells.map((cell, i) => (
                  <Cell key={summaries[i].date} summary={cell} />
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Journée</th>
              {summaries.map((s) => (
                <td
                  key={s.date}
                  className={`grid__cell grid__total${s.complete ? ' grid__cell--done' : ''}${s.hasData ? '' : ' grid__cell--empty'}`}
                  style={{ '--r': percent(s.ratio) } as React.CSSProperties}
                >
                  {s.hasData ? `${percent(s.ratio)} %` : '–'}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
