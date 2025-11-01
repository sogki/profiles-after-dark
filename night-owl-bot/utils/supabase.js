import { createClient } from '@supabase/supabase-js';
import { loadConfig, getConfig } from './config.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client with config from database or env vars
let supabase = null;
let supabaseInitialized = false;

/**
 * Initialize Supabase client
 * Loads configuration from database first, falls back to environment variables
 */
export async function initSupabase() {
  if (supabaseInitialized && supabase) {
    return supabase;
  }

  try {
    // Try to load from database first
    const config = await loadConfig();
    
    const supabaseUrl = config.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Service Role Key not found in configuration or environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    supabaseInitialized = true;
    
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error.message);
    throw error;
  }
}

// Initialize on import (async, but we'll handle it)
let initPromise = null;

/**
 * Get Supabase client (initializes if needed)
 */
export async function getSupabase() {
  if (!initPromise) {
    initPromise = initSupabase();
  }
  return await initPromise;
}

// For backwards compatibility, export a getter
let _supabase = null;
initSupabase().then(client => {
  _supabase = client;
}).catch(() => {
  // Fallback - will be handled by getSupabase
});

export { getSupabase as supabase };

/**
 * Inserts a mod case into Supabase `mod_cases` table.
 * @param {Object} caseData - The mod case details.
 */
export async function insertModCase(caseData) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('mod_cases')
    .insert([caseData]);

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }

  return data;
}

/**
 * Gets the next case_id for a guild by querying the max case_id.
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<number>} next case_id
 */
export async function getNextCaseId(guildId) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('mod_cases')
    .select('case_id')
    .eq('guild_id', guildId)
    .order('case_id', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Supabase query error:', error);
    throw error;
  }

  if (data.length === 0) {
    return 1;
  }

  return data[0].case_id + 1;
}

/**
 * Inserts a moderation log entry into `mod_logs` table.
 * @param {Object} logData - The log details.
 */
export async function insertModLog(logData) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('mod_logs')
    .insert([logData]);

  if (error) {
    console.error('Supabase insertModLog error:', error);
  }
  return data;
}

/**
 * Sets or updates the modlogs channel for a guild.
 * @param {string} guildId - Guild ID
 * @param {string} channelId - Channel ID
 */
export async function setModlogsChannel(guildId, channelId) {
  const db = await getSupabase();
  const { error } = await db
    .from('modlogs_channels')
    .upsert({ guild_id: guildId, channel_id: channelId }, { onConflict: 'guild_id' });

  if (error) {
    console.error('Supabase setModlogsChannel error:', error);
  }
}

/**
 * Gets the modlogs channel ID for a guild.
 * @param {string} guildId - Guild ID
 * @returns {Promise<string|null>} Channel ID or null
 */
export async function getModlogsChannel(guildId) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('modlogs_channels')
    .select('channel_id')
    .eq('guild_id', guildId)
    .single();

  if (error) {
    console.error('Supabase getModlogsChannel error:', error);
    return null;
  }
  return data?.channel_id ?? null;
}
