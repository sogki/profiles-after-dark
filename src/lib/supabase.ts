import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { getConfig } from './config';

// Initialize with environment variables first (required for initial render)
// Use base keys (SUPABASE_URL, SUPABASE_ANON_KEY) with fallback to VITE_ prefixed versions
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create initial client with env vars
let supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Update Supabase client with config from database
(async () => {
  try {
    const config = await getConfig();
    
    // Prefer base keys (SUPABASE_URL, SUPABASE_ANON_KEY) over VITE_ prefixed versions
    const dbSupabaseUrl = config.SUPABASE_URL || config.VITE_SUPABASE_URL;
    const dbSupabaseAnonKey = config.SUPABASE_ANON_KEY || config.VITE_SUPABASE_ANON_KEY;
    
    if (dbSupabaseUrl && (dbSupabaseUrl !== supabaseUrl || dbSupabaseAnonKey !== supabaseAnonKey)) {
      supabaseUrl = dbSupabaseUrl;
      if (dbSupabaseAnonKey) {
        supabaseAnonKey = dbSupabaseAnonKey;
      }
      
      // Recreate client with updated config
      supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
  } catch (error) {
    console.warn('Failed to update Supabase config from database, using environment variables:', error);
  }
})();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY in database)');
}

export { supabase };
