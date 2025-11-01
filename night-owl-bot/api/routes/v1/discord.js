import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/discord/users/:discordId
 * @desc    Get Discord user information
 * @access  Public
 */
router.get('/users/:discordId', async (req, res) => {
  try {
    const db = await getSupabase();
    const { discordId } = req.params;
    
    const { data, error } = await db
      .from('discord_users')
      .select('*, web_user:web_user_id(*)')
      .eq('discord_id', discordId)
      .single();

    if (error) throw error;

    res.json({ success: true, data: data || null });
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/v1/discord/users
 * @desc    Create or update Discord user
 * @access  Public
 * @body    discord_id, web_user_id, username, discriminator, avatar_url, guild_id
 */
router.post('/users', async (req, res) => {
  try {
    const db = await getSupabase();
    const { discord_id, web_user_id, username, discriminator, avatar_url, guild_id } = req.body;

    if (!discord_id || !username || !guild_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields: discord_id, username, guild_id' });
    }

    const { data, error } = await db
      .from('discord_users')
      .upsert({
        discord_id,
        web_user_id,
        username,
        discriminator,
        avatar_url,
        guild_id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'discord_id,guild_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating/updating Discord user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

