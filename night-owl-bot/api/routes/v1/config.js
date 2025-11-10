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
    // We use base keys (without VITE_ prefix) and create VITE_ versions for frontend compatibility
    const publicKeys = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', // Include this but mark as secret in response
      'API_URL',
      'BACKEND_URL',
      'WEB_URL',
      'CLIENT_ID',
      'GUILD_ID'
    ];

    // Build config object with only public values
    const publicConfig = {};
    const secretKeys = new Set(); // Track which keys are secrets
    
    if (configData && configData.length > 0) {
      configData.forEach(item => {
        // Include if it's in the public keys list
        if (publicKeys.includes(item.key)) {
          // For secrets, we still include them but mark them
          if (item.is_secret) {
            secretKeys.add(item.key);
          }
          publicConfig[item.key] = item.value;
        }
      });
    }

    // Create VITE_ prefixed versions for frontend compatibility
    // Frontend will use base keys, but we provide VITE_ versions for backward compatibility
    const viteConfig = {};
    Object.keys(publicConfig).forEach(key => {
      // Map to VITE_ prefixed versions that the frontend expects
      if (key === 'SUPABASE_URL') {
        viteConfig.VITE_SUPABASE_URL = publicConfig[key];
      } else if (key === 'SUPABASE_ANON_KEY') {
        // Always create VITE_ version (even if secret - frontend needs it for Supabase client)
        // The frontend will use this from the API response, not from env vars
        viteConfig.VITE_SUPABASE_ANON_KEY = publicConfig[key];
      } else if (key === 'API_URL') {
        viteConfig.VITE_API_URL = publicConfig[key];
      } else if (key === 'BACKEND_URL') {
        viteConfig.VITE_BACKEND_URL = publicConfig[key];
      } else if (key === 'WEB_URL') {
        viteConfig.VITE_WEB_URL = publicConfig[key];
      }
      
      // Also keep original key for reference (frontend will use these)
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

