import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** null si Supabase n'est pas configuré : l'app reste alors 100 % locale. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
