import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { getConfig } from './config';

// Helper function to get custom domain or fallback to original URL
function getSupabaseUrl(originalUrl: string): string {
  // Check if custom domain is configured via environment variable
  const customDomain = import.meta.env.VITE_SUPABASE_CUSTOM_DOMAIN;
  
  // If custom domain is explicitly set, use it
  if (customDomain && originalUrl) {
    try {
      const url = new URL(originalUrl);
      // Replace the hostname with custom domain
      // Example: https://zzywottwfffyddnorein.supabase.co -> https://profilesafterkdark.com
      return `${url.protocol}//${customDomain}${url.pathname}`;
    } catch (e) {
      // If URL parsing fails, return original
      return originalUrl;
    }
  }
  
  return originalUrl;
}

// Initialize with environment variables first (required for initial render)
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Apply custom domain if configured
const initialUrl = getSupabaseUrl(supabaseUrl || '');

// Create initial client with env vars
let supabase = createClient<Database>(
  initialUrl,
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'profiles-after-dark-web',
      },
    },
  }
);

// Update Supabase client with config from database
(async () => {
  try {
    const config = await getConfig();
    
    // Update URLs if available from database
    let dbSupabaseUrl = config.VITE_SUPABASE_URL || config.SUPABASE_URL;
    const dbSupabaseAnonKey = config.VITE_SUPABASE_ANON_KEY;
    
    // Apply custom domain transformation if configured
    if (dbSupabaseUrl) {
      dbSupabaseUrl = getSupabaseUrl(dbSupabaseUrl);
    }
    
    if (dbSupabaseUrl && (dbSupabaseUrl !== supabaseUrl || dbSupabaseAnonKey !== supabaseAnonKey)) {
      supabaseUrl = dbSupabaseUrl;
      if (dbSupabaseAnonKey) {
        supabaseAnonKey = dbSupabaseAnonKey;
      }
      
      // Recreate client with updated config
      supabase = createClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
          global: {
            headers: {
              'X-Client-Info': 'profiles-after-dark-web',
            },
          },
        }
      );
    }
  } catch (error) {
    console.warn('Failed to update Supabase config from database, using environment variables:', error);
  }
})();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export { supabase };
