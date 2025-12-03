// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

// This is the ONLY safe way to use Supabase with large schemas in Vite + React
// Using <Database> causes "Type instantiation is excessively deep" (TS2589)
// We use <any> — it's what Supabase officially recommends for big projects

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Safety check — helps during development if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseAnonKey ? 'present' : 'missing')
}

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})