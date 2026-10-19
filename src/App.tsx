import { useEffect, useState } from 'react'
import { BlockList } from './components/BlockList'
import { DayProgress } from './components/DayProgress'
import { History } from './components/History'
import { ManageBlocks } from './components/ManageBlocks'
import { Settings } from './components/Settings'
import { SyncPanel } from './components/SyncPanel'
import { ViewTabs, type View } from './components/ViewTabs'
import { toDateKey } from './domain/dates'
import { useAuth } from './hooks/useAuth'
import { useAutoValidate } from './hooks/useAutoValidate'
import { useCloudSync } from './hooks/useCloudSync'
import { useNow } from './hooks/useNow'
import { usePrefs } from './hooks/usePrefs'
import { useStore } from './state/storeContext'
import './App.css'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export default function App() {
  const { state, actions } = useStore()
  const now = useNow()
  const [prefs, updatePrefs] = usePrefs()
  const [view, setView] = useState<View>('today')
  const auth = useAuth()
  const sync = useCloudSync(auth.user)
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
      <ViewTabs view={view} onChange={setView} />
      {/* Région live toujours présente pour que les lecteurs d'écran annoncent la validation. */}
      <p className="toast" role="status" hidden={!celebratedNames?.length}>
        {celebratedNames?.length ? `🎉 ${celebratedNames.join(', ')} : validé !` : ''}
      </p>
      {view === 'history' ? (
        <History today={today} now={now} />
      ) : (
        day && (
          <>
            <DayProgress day={day} now={now} />
            {view === 'manage' ? (
              <ManageBlocks day={day} />
            ) : (
              <>
                <Settings prefs={prefs} onChange={updatePrefs} />
                <SyncPanel auth={auth} sync={sync} />
                <BlockList day={day} now={now} celebrating={celebrating} />
              </>
            )}
          </>
        )
      )}
    </main>
  )
}
