import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/search
 * @desc    Search across profiles, emotes, and wallpapers
 * @access  Public
 * @query   q (required), type (all|profiles|emotes|wallpapers), limit
 */
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const results = {
      profiles: [],
      emotes: [],
      wallpapers: []
    };

    const db = await getSupabase();
    
    if (type === 'all' || type === 'profiles') {
      const { data } = await db
        .from('profiles')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.%${q}%,tags.cs.{${q}}`)
        .limit(parseInt(limit));
      results.profiles = data || [];
    }

    if (type === 'all' || type === 'emotes') {
      const { data } = await db
        .from('emotes')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.%${q}%,tags.cs.{${q}}`)
        .limit(parseInt(limit));
      results.emotes = data || [];
    }

    if (type === 'all' || type === 'wallpapers') {
      const { data } = await db
        .from('wallpapers')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.%${q}%,tags.cs.{${q}}`)
        .limit(parseInt(limit));
      results.wallpapers = data || [];
    }

    const total = results.profiles.length + results.emotes.length + results.wallpapers.length;

    res.json({ 
      success: true, 
      data: results,
      query: q,
      type,
      total
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

