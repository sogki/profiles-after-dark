import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/profiles
 * @desc    Get all profiles with optional filters
 * @access  Public
 * @query   category, type, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const db = await getSupabase();
    const { category, type, limit = 20, offset = 0 } = req.query;
    
    let query = db
      .from('profiles')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (category) query = query.eq('category', category);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ 
      success: true, 
      data, 
      count: data.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/profiles/:id
 * @desc    Get a specific profile by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const db = await getSupabase();
    const { id } = req.params;
    
    const { data, error } = await db
      .from('profiles')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

