import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/moderation/cases/:guildId
 * @desc    Get moderation cases for a guild
 * @access  Public
 * @query   user_id, limit, offset
 */
router.get('/cases/:guildId', async (req, res) => {
  try {
    const db = await getSupabase();
    const { guildId } = req.params;
    const { user_id, limit = 20, offset = 0 } = req.query;

    let query = db
      .from('mod_cases')
      .select('*')
      .eq('guild_id', guildId)
      .order('timestamp', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (user_id) query = query.eq('user_id', user_id);

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
    console.error('Error fetching mod cases:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/v1/moderation/cases
 * @desc    Create a new moderation case
 * @access  Public
 * @body    caseData object
 */
router.post('/cases', async (req, res) => {
  try {
    const db = await getSupabase();
    const caseData = req.body;

    const { data, error } = await db
      .from('mod_cases')
      .insert([caseData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating mod case:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/moderation/logs/:guildId
 * @desc    Get moderation logs for a guild
 * @access  Public
 * @query   limit, offset
 */
router.get('/logs/:guildId', async (req, res) => {
  try {
    const db = await getSupabase();
    const { guildId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await db
      .from('mod_logs')
      .select('*')
      .eq('guild_id', guildId)
      .order('timestamp', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ 
      success: true, 
      data, 
      count: data.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching mod logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

