import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../sync/client'

export interface Auth {
  /** false si les variables d'environnement Supabase sont absentes. */
  configured: boolean
  user: User | null
  loading: boolean
  /** Envoie le lien de connexion ; renvoie un message d'erreur, ou null en cas de succès. */
  signIn(email: string): Promise<string | null>
  signOut(): Promise<void>
}

export function useAuth(): Auth {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(supabase !== null)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string) => {
    if (!supabase) return 'Synchronisation non configurée.'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Revenir sur l'app (et son sous-chemin éventuel, ex. GitHub Pages) après le clic sur le lien.
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    return error ? error.message : null
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  return { configured: supabase !== null, user, loading, signIn, signOut }
}
