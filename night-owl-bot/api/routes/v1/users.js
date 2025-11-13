import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/users/:username
 * @desc    Get comprehensive user information by username
 * @access  Public
 */
router.get('/:username', async (req, res) => {
  try {
    const db = await getSupabase();
    const { username } = req.params;
    
    // Get user profile
    const { data: profile, error: profileError } = await db
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get user badges
    const { data: badges } = await db
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', profile.user_id);

    // Get upload counts (only approved content)
    const [profilesCount, emotesCount, wallpapersCount, emojiCombosCount] = await Promise.all([
      db.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .or('status.is.null,status.eq.approved'),
      db.from('emotes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .or('status.is.null,status.eq.approved'),
      db.from('wallpapers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .or('status.is.null,status.eq.approved'),
      db.from('emoji_combos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .or('status.is.null,status.eq.approved')
        .catch(() => ({ count: 0 }))
    ]);

    // Get total downloads
    const { data: downloads } = await db
      .from('downloads')
      .select('content_id, content_type')
      .eq('user_id', profile.user_id);

    const stats = {
      profiles: profilesCount?.count || 0,
      emotes: emotesCount?.count || 0,
      wallpapers: wallpapersCount?.count || 0,
      emoji_combos: emojiCombosCount?.count || 0,
      total_uploads: (profilesCount?.count || 0) + (emotesCount?.count || 0) + 
                     (wallpapersCount?.count || 0) + (emojiCombosCount?.count || 0),
      total_downloads: downloads?.length || 0,
      badges: badges?.length || 0
    };

    res.json({ 
      success: true, 
      data: {
        profile,
        badges: badges || [],
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/users/discord/:discordId
 * @desc    Get user information by Discord ID
 * @access  Public
 */
router.get('/discord/:discordId', async (req, res) => {
  try {
    const db = await getSupabase();
    const { discordId } = req.params;
    
    // Get Discord user link
    const { data: discordUser } = await db
      .from('discord_users')
      .select('*, user_profiles:web_user_id(*)')
      .eq('discord_id', discordId)
      .single();

    if (!discordUser || !discordUser.web_user_id) {
      return res.status(404).json({ 
        success: false, 
        error: 'Discord user not linked to website account' 
      });
    }

    // Get full user info using the web_user_id
    const { data: profile } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', discordUser.web_user_id)
      .single();

    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'User profile not found' 
      });
    }

    // Get user badges
    const { data: badges } = await db
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', profile.user_id);

    res.json({ 
      success: true, 
      data: {
        profile,
        badges: badges || [],
        discord: {
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar_url: discordUser.avatar_url
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user by Discord ID:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

