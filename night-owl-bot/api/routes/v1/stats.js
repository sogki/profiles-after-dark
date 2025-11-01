import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/stats
 * @desc    Get website statistics
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const db = await getSupabase();
    const [profiles, emotes, wallpapers, discordUsers] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('emotes').select('id', { count: 'exact', head: true }),
      db.from('wallpapers').select('id', { count: 'exact', head: true }),
      db.from('discord_users').select('id', { count: 'exact', head: true })
    ]);

    res.json({
      success: true,
      data: {
        profiles: profiles.count || 0,
        emotes: emotes.count || 0,
        wallpapers: wallpapers.count || 0,
        discordUsers: discordUsers.count || 0,
        total: (profiles.count || 0) + (emotes.count || 0) + (wallpapers.count || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

