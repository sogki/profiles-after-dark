/**
 * Configuration utility for frontend
 * Fetches public configuration values from the API
 */

interface Config {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_API_URL?: string;
  VITE_BACKEND_URL?: string;
  VITE_WEB_URL?: string;
  SUPABASE_URL?: string;
  API_URL?: string;
  BACKEND_URL?: string;
  WEB_URL?: string;
  CLIENT_ID?: string;
  GUILD_ID?: string;
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
        // Merge with environment variables as fallback
        configCache = {
          ...data.data.config,
          // Fallback to env vars for values not in database
          VITE_SUPABASE_URL: data.data.config.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY, // Never from API (secret)
          VITE_API_URL: data.data.config.VITE_API_URL || import.meta.env.VITE_API_URL || defaultApiUrl,
          VITE_BACKEND_URL: data.data.config.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL,
          VITE_WEB_URL: data.data.config.VITE_WEB_URL || import.meta.env.VITE_WEB_URL,
        };
        configCacheTime = Date.now();
        return configCache;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch config from API, using environment variables:', error);
  }

  // Fallback to environment variables
  configCache = {
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

