import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/v1/config
 * @desc    Get public configuration values for frontend
 * @access  Public
 * @note    Only returns non-secret configuration values
 */
router.get('/', async (req, res) => {
  try {
    const db = await getSupabase();
    
    // Get all config from database
    const { data: configData, error } = await db
      .from('bot_config')
      .select('key, value, is_secret')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching config:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch configuration' 
      });
    }

    // Filter out secret values for security
    // Only expose public values that the frontend needs
    const publicKeys = [
      'SUPABASE_URL',
      'API_URL',
      'BACKEND_URL',
      'WEB_URL',
      'CLIENT_ID',
      'GUILD_ID'
    ];

    // Build config object with only public values
    const publicConfig = {};
    
    if (configData && configData.length > 0) {
      configData.forEach(item => {
        // Only include if it's in the public keys list AND not marked as secret
        if (publicKeys.includes(item.key) && !item.is_secret) {
          publicConfig[item.key] = item.value;
        }
      });
    }

    // Also add VITE_ prefixed versions for compatibility
    const viteConfig = {};
    Object.keys(publicConfig).forEach(key => {
      // Map to VITE_ prefixed versions that the frontend expects
      if (key === 'SUPABASE_URL') {
        viteConfig.VITE_SUPABASE_URL = publicConfig[key];
      } else if (key === 'API_URL') {
        viteConfig.VITE_API_URL = publicConfig[key];
      } else if (key === 'BACKEND_URL') {
        viteConfig.VITE_BACKEND_URL = publicConfig[key];
      } else if (key === 'WEB_URL') {
        viteConfig.VITE_WEB_URL = publicConfig[key];
      }
      
      // Also keep original key for reference
      viteConfig[key] = publicConfig[key];
    });

    res.json({
      success: true,
      data: {
        config: viteConfig,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;

