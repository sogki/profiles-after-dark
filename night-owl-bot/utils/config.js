import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client with minimal access for config retrieval
// We MUST use environment variables first to get Supabase credentials
// Then we can load config from database
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let configCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Initialize Supabase client for config access
 * Must use environment variables - no database dependency
 * Falls back to environment variables if database is not available
 */
function initSupabase() {
  if (!supabase && supabaseUrl && supabaseServiceKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
      // Test connection (non-blocking)
      supabase.from('bot_config').select('key').limit(1).then(() => {
        console.log('✅ Connected to Supabase for config');
      }).catch((err) => {
        console.warn('⚠️  Supabase connection test failed:', err.message);
        console.warn('⚠️  Will fall back to environment variables');
      });
    } catch (error) {
      console.warn('⚠️  Failed to initialize Supabase for config:', error.message);
      console.warn('⚠️  Falling back to environment variables');
    }
  } else if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment');
    console.warn('⚠️  Cannot load config from database, using environment variables only');
  }
  return supabase;
}

/**
 * Get config from environment variables (fallback)
 */
function getConfigFromEnv(key) {
  return process.env[key] || null;
}

/**
 * Load all configuration from database
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfig() {
  // Return cached config if still valid
  if (configCache && Date.now() - lastCacheUpdate < CACHE_TTL) {
    return configCache;
  }

  const config = {};

  // Try to load from database (only if we have Supabase credentials)
  try {
    const client = initSupabase();
    
    if (client && supabaseUrl && supabaseServiceKey) {
      // Use Promise.race for timeout (Supabase doesn't have .timeout())
      const queryPromise = client
        .from('bot_config')
        .select('key, value, category')
        .order('category', { ascending: true });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000)
      );
      
      let queryResult;
      try {
        // Race the query against a timeout
        const result = await Promise.race([
          queryPromise.then(result => ({ success: true, result })),
          timeoutPromise.then(() => ({ success: false, error: new Error('Timeout') }))
        ]);
        
        if (result.success) {
          queryResult = result.result;
        } else {
          queryResult = { data: null, error: result.error };
        }
      } catch (err) {
        // Query error or timeout
        console.warn('⚠️  Database query failed:', err.message);
        queryResult = { data: null, error: err };
      }
      
      const { data, error } = queryResult || { data: null, error: null };

      if (error) {
        console.warn('⚠️  Failed to load config from database:', error.message);
        console.warn('⚠️  Falling back to environment variables');
      } else if (data && data.length > 0) {
        // Build config object from database - PRIORITY SOURCE
        data.forEach(item => {
          config[item.key] = item.value;
        });
        
        // Only fill in missing keys from environment variables
        const knownKeys = [
          'DISCORD_TOKEN',
          'CLIENT_ID',
          'GUILD_ID',
          'SUPABASE_URL',
          'SUPABASE_SERVICE_ROLE_KEY',
          'API_URL',
          'BACKEND_URL',
          'WEB_URL',
          'STAFF_LOG_CHANNEL_ID',
          'PORT',
          'NODE_ENV',
          'RAILWAY_PUBLIC_DOMAIN',
          'RAILWAY_ENVIRONMENT'
        ];

        // Add missing keys from environment (only if not in database)
        knownKeys.forEach(key => {
          if (!config[key]) {
            const envValue = getConfigFromEnv(key);
            if (envValue) {
              config[key] = envValue;
              console.log(`   📝 ${key} not in database, using environment variable`);
            }
          }
        });
        
        configCache = config;
        lastCacheUpdate = Date.now();
        
        // Log which keys were loaded from database
        const dbKeys = data.map(item => item.key);
        const envKeys = knownKeys.filter(key => config[key] && !dbKeys.includes(key));
        console.log(`✅ Loaded ${data.length} configuration value(s) from database`);
        console.log(`   Database keys: ${dbKeys.join(', ')}`);
        if (envKeys.length > 0) {
          console.log(`   Environment keys (fallback): ${envKeys.join(', ')}`);
        }
        
        return config;
      } else {
        console.warn('⚠️  No configuration found in database');
        console.warn('⚠️  Using environment variables as fallback');
      }
    } else {
      console.warn('⚠️  Supabase not configured, using environment variables');
    }
  } catch (error) {
    console.warn('⚠️  Error loading config from database:', error.message);
    console.warn('⚠️  Falling back to environment variables');
  }

  // Fallback to environment variables
  console.log('📝 Loading configuration from environment variables...');
  
  // Load all known config keys from environment
  const knownKeys = [
    'DISCORD_TOKEN',
    'CLIENT_ID',
    'GUILD_ID',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'API_URL',
    'BACKEND_URL',
    'WEB_URL',
    'STAFF_LOG_CHANNEL_ID',
    'PORT',
    'NODE_ENV',
    'RAILWAY_PUBLIC_DOMAIN',
    'RAILWAY_ENVIRONMENT'
  ];

  knownKeys.forEach(key => {
    const value = getConfigFromEnv(key);
    if (value) {
      config[key] = value;
    }
  });

  configCache = config;
  lastCacheUpdate = Date.now();
  
  return config;
}

/**
 * Get a single configuration value
 * @param {string} key - Configuration key
 * @param {string} defaultValue - Default value if not found
 * @returns {Promise<string|null>} Configuration value
 */
export async function getConfig(key, defaultValue = null) {
  // Try cache first
  if (configCache && configCache[key]) {
    return configCache[key];
  }

  // Try database
  try {
    const client = initSupabase();
    
    if (client) {
      const { data, error } = await client
        .from('bot_config')
        .select('value')
        .eq('key', key)
        .single();

      if (!error && data) {
        return data.value;
      }
    }
  } catch (error) {
    // Fall through to environment variable
  }

  // Fallback to environment variable
  return getConfigFromEnv(key) || defaultValue;
}

/**
 * Set a configuration value in the database
 * @param {string} key - Configuration key
 * @param {string} value - Configuration value
 * @param {string} description - Optional description
 * @param {string} category - Configuration category
 * @param {boolean} isSecret - Whether this is a secret value
 */
export async function setConfig(key, value, description = null, category = 'general', isSecret = true) {
  try {
    const client = initSupabase();
    
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('bot_config')
      .upsert({
        key,
        value,
        description,
        category,
        is_secret: isSecret
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Invalidate cache
    configCache = null;
    lastCacheUpdate = 0;

    console.log(`✅ Set config: ${key} (${isSecret ? 'secret' : 'public'})`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to set config ${key}:`, error.message);
    throw error;
  }
}

/**
 * Initialize configuration in database from environment variables
 * This is a one-time setup function
 */
export async function initializeConfigFromEnv() {
  console.log('🔄 Initializing configuration from environment variables...');
  
  const configs = [
    {
      key: 'DISCORD_TOKEN',
      description: 'Discord bot token',
      category: 'discord',
      isSecret: true
    },
    {
      key: 'CLIENT_ID',
      description: 'Discord bot client ID',
      category: 'discord',
      isSecret: false
    },
    {
      key: 'GUILD_ID',
      description: 'Discord guild/server ID (optional)',
      category: 'discord',
      isSecret: false
    },
    {
      key: 'SUPABASE_URL',
      description: 'Supabase project URL',
      category: 'supabase',
      isSecret: false
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase service role key',
      category: 'supabase',
      isSecret: true
    },
    {
      key: 'API_URL',
      description: 'API server URL (e.g., https://dev.profilesafterdark.com)',
      category: 'api',
      isSecret: false
    },
    {
      key: 'BACKEND_URL',
      description: 'Backend URL (alias for API_URL)',
      category: 'api',
      isSecret: false
    },
    {
      key: 'WEB_URL',
      description: 'Website URL (e.g., https://profilesafterdark.com)',
      category: 'api',
      isSecret: false
    },
    {
      key: 'PORT',
      description: 'Server port (default: 3000)',
      category: 'api',
      isSecret: false
    },
    {
      key: 'STAFF_LOG_CHANNEL_ID',
      description: 'Discord channel ID for staff logs',
      category: 'discord',
      isSecret: false
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const config of configs) {
    const value = getConfigFromEnv(config.key);
    
    if (value) {
      try {
        await setConfig(
          config.key,
          value,
          config.description,
          config.category,
          config.isSecret
        );
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to set ${config.key}:`, error.message);
        errorCount++;
      }
    } else {
      console.warn(`⚠️  ${config.key} not found in environment variables, skipping...`);
    }
  }

  console.log(`\n✅ Initialized ${successCount} configuration value(s)`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} error(s) encountered`);
  }
}

