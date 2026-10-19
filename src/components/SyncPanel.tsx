import { useState, type FormEvent } from 'react'
import type { Auth } from '../hooks/useAuth'
import type { SyncStatus } from '../hooks/useCloudSync'

interface Props {
  auth: Auth
  sync: { status: SyncStatus; lastSyncedAt: number | null; error: string | null }
}

const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

function describeError(message: string): string {
  return message.includes('app_state')
    ? 'La table app_state est introuvable : exécute supabase/schema.sql dans le SQL Editor de Supabase.'
    : message
}

export function SyncPanel({ auth, sync }: Props) {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  if (!auth.configured) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    const failure = await auth.signIn(email.trim())
    setSending(false)
    if (failure) setError(failure)
    else setSentTo(email.trim())
  }

  const summary = !auth.user
    ? 'non connecté'
    : sync.status === 'synced'
      ? '✓ synchronisé'
      : sync.status === 'error'
        ? '⚠ erreur'
        : 'synchronisation…'

  return (
    <details className="sync">
      <summary>
        ☁️ Synchronisation <span className="sync__state">({summary})</span>
      </summary>
      <div className="sync__body">
        {auth.loading ? null : auth.user ? (
          <>
            <p>
              Connecté : <strong>{auth.user.email}</strong>
            </p>
            <p role="status">
              {sync.status === 'error' && sync.error
                ? `⚠ ${describeError(sync.error)}`
                : sync.lastSyncedAt
                  ? `Dernière synchro à ${timeFormat.format(sync.lastSyncedAt)}.`
                  : 'Synchronisation en cours…'}
            </p>
            <button type="button" className="btn btn--small" onClick={() => void auth.signOut()}>
              Se déconnecter
            </button>
          </>
        ) : sentTo ? (
          <p role="status">
            Lien envoyé à <strong>{sentTo}</strong>. Ouvre-le sur cet appareil pour te connecter.
          </p>
        ) : (
          <form className="sync__form" onSubmit={submit}>
            <p>Retrouve tes journées sur tous tes appareils. Un lien de connexion t’est envoyé par email, sans mot de passe.</p>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <button type="submit" className="btn btn--small" disabled={sending || email.trim() === ''}>
              {sending ? 'Envoi…' : 'Recevoir le lien'}
            </button>
            {error && <p role="alert">{error}</p>}
          </form>
        )}
      </div>
    </details>
  )
}
