import { useState } from 'react'
import { notificationsSupported, requestNotifications } from '../lib/notify'
import { playChime, primeSound } from '../lib/sound'
import type { Prefs } from '../storage/prefs'

interface Props {
  prefs: Prefs
  onChange(patch: Partial<Prefs>): void
}

export function Settings({ prefs, onChange }: Props) {
  const [denied, setDenied] = useState(false)

  async function toggleNotifications(enabled: boolean) {
    if (!enabled) return onChange({ notifications: false })
    const granted = await requestNotifications()
    setDenied(!granted)
    onChange({ notifications: granted })
  }

  function toggleSound(enabled: boolean) {
    onChange({ sound: enabled })
    if (enabled) {
      primeSound()
      playChime() // aperçu, et déblocage de l'audio par le geste utilisateur
    }
  }

  return (
    <fieldset className="settings">
      <legend className="visually-hidden">Alertes de validation</legend>
      <label>
        <input type="checkbox" checked={prefs.sound} onChange={(e) => toggleSound(e.target.checked)} />
        🔊 Son
      </label>
      {notificationsSupported() && (
        <label>
          <input
            type="checkbox"
            checked={prefs.notifications}
            onChange={(e) => void toggleNotifications(e.target.checked)}
          />
          🔔 Notifications
        </label>
      )}
      {denied && <span className="settings__hint">Notifications bloquées dans le navigateur.</span>}
    </fieldset>
  )
}
