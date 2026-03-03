import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Mancano le chiavi di Supabase nel file .env. Le funzioni di database non funzioneranno.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
