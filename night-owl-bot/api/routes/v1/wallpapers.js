import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/wallpapers
 * @desc    Get all wallpapers with optional filters
 * @access  Public
 * @query   category, resolution, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const db = await getSupabase();
    const { category, resolution, limit = 20, offset = 0 } = req.query;
    
    let query = db
      .from('wallpapers')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .or('status.is.null,status.eq.approved') // Only show approved content
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (category) query = query.eq('category', category);
    if (resolution) query = query.eq('resolution', resolution);

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
    console.error('Error fetching wallpapers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/wallpapers/:id
 * @desc    Get a specific wallpaper by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const db = await getSupabase();
    const { id } = req.params;
    
    const { data, error } = await db
      .from('wallpapers')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .eq('id', id)
      .or('status.is.null,status.eq.approved') // Only show approved content
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Wallpaper not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching wallpaper:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

