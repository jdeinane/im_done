export type View = 'today' | 'manage' | 'history'

const TABS: { view: View; label: string }[] = [
  { view: 'today', label: 'Journée' },
  { view: 'manage', label: '⚙️ Blocs' },
  { view: 'history', label: '📅 Historique' },
]

export function ViewTabs({ view, onChange }: { view: View; onChange(view: View): void }) {
  return (
    <nav className="tabs" aria-label="Vues">
      {TABS.map((tab) => (
        <button
          key={tab.view}
          type="button"
          className="tabs__tab"
          aria-current={tab.view === view ? 'page' : undefined}
          onClick={() => onChange(tab.view)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
