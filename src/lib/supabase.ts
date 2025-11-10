import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { getConfig } from './config';

// Initialize with environment variables first (required for initial render)
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
    
    // Update URLs if available from database
    const dbSupabaseUrl = config.VITE_SUPABASE_URL || config.SUPABASE_URL;
    const dbSupabaseAnonKey = config.VITE_SUPABASE_ANON_KEY;
    
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
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export { supabase };
