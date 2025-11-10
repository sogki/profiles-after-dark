/**
 * Configuration utility for frontend
 * Fetches public configuration values from the API
 */

interface Config {
  // Base keys (preferred - single source of truth)
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  API_URL?: string;
  BACKEND_URL?: string;
  WEB_URL?: string;
  CLIENT_ID?: string;
  GUILD_ID?: string;
  // VITE_ prefixed versions (for backward compatibility, derived from base keys)
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_API_URL?: string;
  VITE_BACKEND_URL?: string;
  VITE_WEB_URL?: string;
}

let configCache: Config | null = null;
let configCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get public configuration from API
 * Falls back to environment variables if API is unavailable
 */
export async function getConfig(): Promise<Config> {
  // Return cached config if still valid
  if (configCache && Date.now() - configCacheTime < CACHE_TTL) {
    return configCache;
  }

  // Default API URL from env or fallback
  const defaultApiUrl = import.meta.env.VITE_API_URL || 'https://dev.profilesafterdark.com/api/v1';
  
  try {
    const response = await fetch(`${defaultApiUrl}/config`);
    
    if (response.ok && response.status !== 404) {
      const data = await response.json();
      
      if (data.success && data.data?.config) {
        // Use base keys from API (single source of truth)
        // VITE_ prefixed versions are derived from base keys by the API
        configCache = {
          ...data.data.config,
          // Prefer base keys over VITE_ prefixed versions
          SUPABASE_URL: data.data.config.SUPABASE_URL || data.data.config.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
          SUPABASE_ANON_KEY: data.data.config.SUPABASE_ANON_KEY || data.data.config.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
          API_URL: data.data.config.API_URL || data.data.config.VITE_API_URL || import.meta.env.VITE_API_URL || defaultApiUrl,
          BACKEND_URL: data.data.config.BACKEND_URL || data.data.config.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL,
          WEB_URL: data.data.config.WEB_URL || data.data.config.VITE_WEB_URL || import.meta.env.VITE_WEB_URL,
          // Keep VITE_ versions for backward compatibility
          VITE_SUPABASE_URL: data.data.config.VITE_SUPABASE_URL || data.data.config.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: data.data.config.VITE_SUPABASE_ANON_KEY || data.data.config.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
          VITE_API_URL: data.data.config.VITE_API_URL || data.data.config.API_URL || import.meta.env.VITE_API_URL || defaultApiUrl,
          VITE_BACKEND_URL: data.data.config.VITE_BACKEND_URL || data.data.config.BACKEND_URL || import.meta.env.VITE_BACKEND_URL,
          VITE_WEB_URL: data.data.config.VITE_WEB_URL || data.data.config.WEB_URL || import.meta.env.VITE_WEB_URL,
        };
        configCacheTime = Date.now();
        return configCache;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch config from API, using environment variables:', error);
  }

  // Fallback to environment variables
  // Map VITE_ env vars to base keys for consistency
  configCache = {
    // Base keys (preferred)
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    API_URL: import.meta.env.VITE_API_URL || defaultApiUrl,
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    WEB_URL: import.meta.env.VITE_WEB_URL,
    // VITE_ versions (for backward compatibility)
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_API_URL: import.meta.env.VITE_API_URL || defaultApiUrl,
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    VITE_WEB_URL: import.meta.env.VITE_WEB_URL,
  };
  configCacheTime = Date.now();
  return configCache;
}

/**
 * Get a specific config value
 */
export async function getConfigValue(key: keyof Config): Promise<string | undefined> {
  const config = await getConfig();
  return config[key];
}

/**
 * Initialize config on app startup
 */
export async function initConfig(): Promise<Config> {
  return await getConfig();
}

