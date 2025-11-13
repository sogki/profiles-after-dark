import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/search
 * @desc    Search across profiles, emotes, wallpapers, and emoji combos
 * @access  Public
 * @query   q (required), type (all|profiles|emotes|wallpapers|emoji_combos), limit
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
      wallpapers: [],
      emoji_combos: []
    };

    const db = await getSupabase();
    const searchTerm = `%${q}%`;
    
    if (type === 'all' || type === 'profiles') {
      const { data, error } = await db
        .from('profiles')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.${searchTerm},tags.cs.{${q}}`)
        .or('status.is.null,status.eq.approved')
        .limit(parseInt(limit));
      
      if (!error) {
        results.profiles = data || [];
      }
    }

    if (type === 'all' || type === 'emotes') {
      const { data, error } = await db
        .from('emotes')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.${searchTerm},tags.cs.{${q}}`)
        .or('status.is.null,status.eq.approved')
        .limit(parseInt(limit));
      
      if (!error) {
        results.emotes = data || [];
      }
    }

    if (type === 'all' || type === 'wallpapers') {
      const { data, error } = await db
        .from('wallpapers')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.${searchTerm},tags.cs.{${q}}`)
        .or('status.is.null,status.eq.approved')
        .limit(parseInt(limit));
      
      if (!error) {
        results.wallpapers = data || [];
      }
    }

    if (type === 'all' || type === 'emoji_combos') {
      try {
        const { data, error } = await db
          .from('emoji_combos')
          .select('*, user_profiles:user_id(username, display_name, avatar_url)')
          .or(`title.ilike.${searchTerm},tags.cs.{${q}}`)
          .or('status.is.null,status.eq.approved')
          .limit(parseInt(limit));
        
        if (!error) {
          results.emoji_combos = data || [];
        }
      } catch (err) {
        // Table might not exist, ignore
        console.warn('Error searching emoji_combos:', err.message);
      }
    }

    const total = results.profiles.length + results.emotes.length + results.wallpapers.length + results.emoji_combos.length;

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

