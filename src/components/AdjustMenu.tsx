import type { BlockStatus } from '../domain/progress'
import type { Block, BlockProgress } from '../domain/types'

const STEPS = [-15, -5, 5, 15, 30]

interface Props {
  block: Block
  progress: BlockProgress
  status: BlockStatus
  onAdjust(deltaMin: number): void
  onSetValidated(value: boolean): void
}

export function AdjustMenu({ block, progress, status, onAdjust, onSetValidated }: Props) {
  // Validé par le temps : rien à valider à la main. Seule une validation manuelle s'annule.
  const canValidate = status !== 'done'
  const canUnvalidate = progress.manuallyValidated

  return (
    <details className="adjust">
      <summary>Ajuster</summary>
      <div className="adjust__body">
        <div className="adjust__steps" role="group" aria-label={`Ajuster le temps de ${block.name}`}>
          {STEPS.map((step) => (
            <button
              key={step}
              type="button"
              className="btn btn--small"
              aria-label={`${step > 0 ? 'Ajouter' : 'Retirer'} ${Math.abs(step)} minutes à ${block.name}`}
              onClick={() => onAdjust(step)}
            >
              {step > 0 ? `+${step}` : `−${Math.abs(step)}`} min
            </button>
          ))}
        </div>
        {canValidate && (
          <button type="button" className="btn btn--small" onClick={() => onSetValidated(true)}>
            ✓ Marquer validé
          </button>
        )}
        {canUnvalidate && (
          <button type="button" className="btn btn--small" onClick={() => onSetValidated(false)}>
            Annuler la validation
          </button>
        )}
      </div>
    </details>
  )
}
