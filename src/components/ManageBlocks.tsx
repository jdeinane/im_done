import { useState } from 'react'
import { sameBlocks } from '../domain/template'
import type { Block, Day } from '../domain/types'
import { formatDuration } from '../lib/format'
import { newBlockId } from '../lib/id'
import { useStore } from '../state/storeContext'
import { BlockEditor } from './BlockEditor'

const PALETTE = ['#6366f1', '#0ea5e9', '#ec4899', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

function blankBlock(index: number): Block {
  return { id: newBlockId(), name: '', emoji: '⏱️', color: PALETTE[index % PALETTE.length], targetMin: 60 }
}

export function ManageBlocks({ day }: { day: Day }) {
  const { state, actions } = useStore()
  // null : rien d'ouvert ; sinon le bloc en cours d'édition (nouveau ou existant).
  const [editing, setEditing] = useState<{ block: Block; isNew: boolean } | null>(null)
  const inSync = sameBlocks(day.blocks, state.template)

  function save(block: Block) {
    if (editing?.isNew) actions.addBlock(block)
    else actions.updateBlock(block)
    setEditing(null)
  }

  function remove(block: Block) {
    // Supprimer efface aussi le temps déjà accompli aujourd'hui sur ce bloc.
    if (window.confirm(`Supprimer « ${block.name} » de la journée (temps accompli compris) ?`)) {
      if (editing?.block.id === block.id) setEditing(null)
      actions.deleteBlock(block.id)
    }
  }

  function applyTemplate() {
    if (window.confirm('Remplacer les blocs d’aujourd’hui par le modèle ? Le temps des blocs absents du modèle sera perdu.')) {
      setEditing(null)
      actions.applyTemplate()
    }
  }

  return (
    <section className="manage" aria-label="Gestion des blocs">
      <ol className="manage__list">
        {day.blocks.map((block, i) => (
          <li key={block.id} className="manage__row" style={{ '--block-color': block.color } as React.CSSProperties}>
            {editing?.block.id === block.id && !editing.isNew ? (
              <BlockEditor initial={editing.block} isNew={false} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <>
                <span className="manage__label">
                  <span aria-hidden="true">{block.emoji}</span> {block.name}
                  <small> · {formatDuration(block.targetMin)}</small>
                </span>
                <span className="manage__buttons">
                  <button
                    type="button"
                    className="btn btn--small"
                    aria-label={`Monter ${block.name}`}
                    disabled={i === 0}
                    onClick={() => actions.moveBlock(block.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn--small"
                    aria-label={`Descendre ${block.name}`}
                    disabled={i === day.blocks.length - 1}
                    onClick={() => actions.moveBlock(block.id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--small"
                    aria-label={`Modifier ${block.name}`}
                    onClick={() => setEditing({ block, isNew: false })}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn btn--small"
                    aria-label={`Supprimer ${block.name}`}
                    onClick={() => remove(block)}
                  >
                    🗑️
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ol>

      {editing?.isNew ? (
        <BlockEditor initial={editing.block} isNew onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <button
          type="button"
          className="btn"
          onClick={() => setEditing({ block: blankBlock(day.blocks.length), isNew: true })}
        >
          + Ajouter un bloc
        </button>
      )}

      <div className="manage__template">
        <p>
          Ces changements s’appliquent à aujourd’hui. Le <strong>modèle</strong> est copié chaque nouveau jour (temps
          remis à zéro).
        </p>
        <p className={inSync ? 'manage__sync' : 'manage__sync manage__sync--dirty'} role="status">
          {inSync ? '✓ Aujourd’hui correspond au modèle.' : 'Aujourd’hui diffère du modèle.'}
        </p>
        <div className="manage__buttons">
          <button type="button" className="btn btn--primary" disabled={inSync} onClick={actions.saveTemplate}>
            Enregistrer comme modèle
          </button>
          <button type="button" className="btn" disabled={inSync} onClick={applyTemplate}>
            Appliquer le modèle à aujourd’hui
          </button>
        </div>
      </div>
    </section>
  )
}
