import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Inserts a mod case into Supabase `mod_cases` table.
 * @param {Object} caseData - The mod case details.
 */
export async function insertModCase(caseData) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { error } = await supabase
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
  const { data, error } = await supabase
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
