import { useEffect } from 'react'
import { BlockList } from './components/BlockList'
import { DayProgress } from './components/DayProgress'
import { toDateKey } from './domain/dates'
import { useNow } from './hooks/useNow'
import { useStore } from './state/storeContext'
import './App.css'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export default function App() {
  const { state, actions } = useStore()
  const now = useNow()
  const today = toDateKey(now)
  const day = state.days[today]

  // Passage à minuit app ouverte : crée le nouveau jour depuis le modèle.
  useEffect(() => {
    if (!day) actions.tick()
  }, [day, actions])

  return (
    <main className="app">
      <header className="app__header">
        <h1>imDone</h1>
        <p>{dateFormat.format(now)}</p>
      </header>
      {day && (
        <>
          <DayProgress day={day} now={now} />
          <BlockList day={day} now={now} />
        </>
      )}
    </main>
  )
}
