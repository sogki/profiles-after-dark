import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/emoji_combos
 * @desc    Get all emoji combos with optional filters
 * @access  Public
 * @query   limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const db = await getSupabase();
    const { limit = 20, offset = 0 } = req.query;
    
    let query = db
      .from('emoji_combos')
      .select('*')
      .or('status.is.null,status.eq.approved') // Only show approved content
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error } = await query;

    if (error) {
      // Table might not exist, return empty array
      if (error.code === '42P01') {
        return res.json({ 
          success: true, 
          data: [], 
          count: 0,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      }
      throw error;
    }

    // Fetch user profiles separately and merge
    if (data && data.length > 0 && data[0].user_id) {
      const userIds = [...new Set(data.map(item => item.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: userProfiles } = await db
          .from('user_profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        // Create a map for quick lookup
        const userMap = new Map();
        if (userProfiles) {
          userProfiles.forEach(user => {
            userMap.set(user.user_id, user);
          });
        }

        // Merge user profiles into data
        data.forEach(item => {
          if (item.user_id) {
            item.user_profiles = userMap.get(item.user_id) || null;
          }
        });
      }
    }

    res.json({ 
      success: true, 
      data: data || [], 
      count: data?.length || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching emoji combos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/emoji_combos/:id
 * @desc    Get a specific emoji combo by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const db = await getSupabase();
    const { id } = req.params;
    
    const { data, error } = await db
      .from('emoji_combos')
      .select('*')
      .eq('id', id)
      .or('status.is.null,status.eq.approved') // Only show approved content
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Emoji combo not found' });
      }
      throw error;
    }

    // Fetch user profile separately
    if (data && data.user_id) {
      const { data: userProfile } = await db
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('user_id', data.user_id)
        .single();
      
      data.user_profiles = userProfile || null;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching emoji combo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

