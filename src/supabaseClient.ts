import { createClient } from '@supabase/supabase-js';

// Usiamo un metodo più robusto per leggere le variabili sia in locale che su Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('ERRORE: VITE_SUPABASE_URL non trovata! Controlla i Secrets/Environment Variables.');
}
if (!supabaseAnonKey) {
  console.error('ERRORE: VITE_SUPABASE_ANON_KEY non trovata! Controlla i Secrets/Environment Variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-error.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
