import { useEffect, useState } from 'react'
import { BlockList } from './components/BlockList'
import { DayProgress } from './components/DayProgress'
import { ManageBlocks } from './components/ManageBlocks'
import { Settings } from './components/Settings'
import { toDateKey } from './domain/dates'
import { useAutoValidate } from './hooks/useAutoValidate'
import { useNow } from './hooks/useNow'
import { usePrefs } from './hooks/usePrefs'
import { useStore } from './state/storeContext'
import './App.css'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export default function App() {
  const { state, actions } = useStore()
  const now = useNow()
  const [prefs, updatePrefs] = usePrefs()
  const [managing, setManaging] = useState(false)
  const today = toDateKey(now)
  const day = state.days[today]
  const celebrating = useAutoValidate(day, now, prefs, actions.markNotified)

  // Passage à minuit app ouverte : crée le nouveau jour depuis le modèle.
  useEffect(() => {
    if (!day) actions.tick()
  }, [day, actions])

  const celebratedNames = day?.blocks.filter((b) => celebrating.has(b.id)).map((b) => `${b.emoji} ${b.name}`)

  return (
    <main className="app">
      <header className="app__header">
        <h1>imDone</h1>
        <p>{dateFormat.format(now)}</p>
      </header>
      <div className="toolbar">
        <Settings prefs={prefs} onChange={updatePrefs} />
        <button type="button" className="btn btn--small" aria-pressed={managing} onClick={() => setManaging((m) => !m)}>
          {managing ? '← Retour à la journée' : '⚙️ Gérer les blocs'}
        </button>
      </div>
      {/* Région live toujours présente pour que les lecteurs d'écran annoncent la validation. */}
      <p className="toast" role="status" hidden={!celebratedNames?.length}>
        {celebratedNames?.length ? `🎉 ${celebratedNames.join(', ')} : validé !` : ''}
      </p>
      {day && (
        <>
          <DayProgress day={day} now={now} />
          {managing ? <ManageBlocks day={day} /> : <BlockList day={day} now={now} celebrating={celebrating} />}
        </>
      )}
    </main>
  )
}
