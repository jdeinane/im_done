import { useState, type FormEvent } from 'react'
import type { Block } from '../domain/types'
import { formatDuration } from '../lib/format'

const EMOJI_SUGGESTIONS = ['🧩', '💻', '🧘', '🏋️', '📚', '🎧', '✍️', '🏃', '🎨', '🧹']
const MAX_MIN = 24 * 60

interface Props {
  initial: Block
  isNew: boolean
  onSave(block: Block): void
  onCancel(): void
}

export function BlockEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial.name)
  const [emoji, setEmoji] = useState(initial.emoji)
  const [color, setColor] = useState(initial.color)
  const [targetMin, setTargetMin] = useState(String(initial.targetMin))

  const minutes = Number(targetMin)
  const nameOk = name.trim().length > 0
  const minutesOk = Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_MIN

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!nameOk || !minutesOk) return
    onSave({ ...initial, name: name.trim(), emoji: emoji.trim() || '⏱️', color, targetMin: minutes })
  }

  return (
    <form className="editor" onSubmit={submit} aria-label={isNew ? 'Nouveau bloc' : `Modifier ${initial.name}`}>
      <label>
        Nom
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required autoFocus />
      </label>
      <div className="editor__row">
        <label>
          Emoji
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={8}
            list="emoji-suggestions"
            className="editor__emoji"
          />
          <datalist id="emoji-suggestions">
            {EMOJI_SUGGESTIONS.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </label>
        <label>
          Couleur
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label>
          Durée cible (min)
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_MIN}
            value={targetMin}
            onChange={(e) => setTargetMin(e.target.value)}
            aria-invalid={!minutesOk}
          />
          <span className="editor__hint">{minutesOk ? `= ${formatDuration(minutes)}` : `Entre 1 et ${MAX_MIN}`}</span>
        </label>
      </div>
      <div className="editor__actions">
        <button type="submit" className="btn btn--primary" disabled={!nameOk || !minutesOk}>
          {isNew ? 'Ajouter' : 'Enregistrer'}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  )
}
