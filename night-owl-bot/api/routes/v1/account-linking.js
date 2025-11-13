import express from 'express';
import { getSupabase } from '../../../utils/supabase.js';
import { createAccountLinkingNotification } from '../../../utils/notifications.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Generate a random 8-character code
 */
function generateLinkingCode() {
  // Generate a random 8-character alphanumeric code (uppercase)
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * @route   POST /api/v1/account-linking/generate
 * @desc    Generate a one-time use linking code for the authenticated user
 * @access  Private (requires user authentication via Supabase JWT)
 */
router.post('/generate', async (req, res) => {
  try {
    // Get user from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required. Please provide a valid token.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const db = await getSupabase();
    
    // Verify token and get user
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token.' 
      });
    }

    // Check if user already has an active code
    const { data: existingCode } = await db
      .from('account_linking_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingCode) {
      return res.json({
        success: true,
        data: {
          code: existingCode.code,
          expires_at: existingCode.expires_at,
          message: 'Using existing active code'
        }
      });
    }

    // Generate new code
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = generateLinkingCode();
      const { data: existing } = await db
        .from('account_linking_codes')
        .select('code')
        .eq('code', code)
        .single();
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate unique code. Please try again.'
      });
    }

    // Create code with 15 minute expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { data: newCode, error } = await db
      .from('account_linking_codes')
      .insert({
        code,
        user_id: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating linking code:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate linking code.'
      });
    }

    res.json({
      success: true,
      data: {
        code: newCode.code,
        expires_at: newCode.expires_at,
        message: 'Code generated successfully'
      }
    });
  } catch (error) {
    console.error('Error generating linking code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/v1/account-linking/validate
 * @desc    Validate and use a linking code (called by Discord bot)
 * @access  Public (but requires Discord bot authentication)
 */
router.post('/validate', async (req, res) => {
  try {
    const { code, discord_id, username, discriminator, avatar_url, guild_id } = req.body;

    if (!code || !discord_id || !username || !guild_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, discord_id, username, guild_id'
      });
    }

    const db = await getSupabase();

    // Find the code
    const { data: linkingCode, error: codeError } = await db
      .from('account_linking_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (codeError || !linkingCode) {
      return res.status(404).json({
        success: false,
        error: 'Invalid linking code.'
      });
    }

    // Check if code is already used
    if (linkingCode.used) {
      return res.status(400).json({
        success: false,
        error: 'This code has already been used.'
      });
    }

    // Check if code is expired
    if (new Date(linkingCode.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'This code has expired. Please generate a new one.'
      });
    }

    // Check if Discord account is already linked to another user
    const { data: existingLink } = await db
      .from('discord_users')
      .select('*')
      .eq('discord_id', discord_id)
      .eq('guild_id', guild_id)
      .single();

    if (existingLink && existingLink.web_user_id && existingLink.web_user_id !== linkingCode.user_id) {
      return res.status(400).json({
        success: false,
        error: 'This Discord account is already linked to another website account.'
      });
    }

    // Mark code as used
    const { error: updateError } = await db
      .from('account_linking_codes')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        discord_id: discord_id
      })
      .eq('id', linkingCode.id);

    if (updateError) {
      console.error('Error updating linking code:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process linking code.'
      });
    }

    // Link Discord account to website account
    const { data: discordUser, error: linkError } = await db
      .from('discord_users')
      .upsert({
        discord_id,
        web_user_id: linkingCode.user_id,
        username,
        discriminator,
        avatar_url,
        guild_id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'discord_id,guild_id' })
      .select()
      .single();

    if (linkError) {
      console.error('Error linking accounts:', linkError);
      return res.status(500).json({
        success: false,
        error: 'Failed to link accounts.'
      });
    }

    // Get user profile for notification
    const { data: userProfile } = await db
      .from('user_profiles')
      .select('username, display_name')
      .eq('user_id', linkingCode.user_id)
      .single();

    // Create notification for website user (only if it doesn't already exist)
    try {
      await createAccountLinkingNotification(
        linkingCode.user_id,
        discordId,
        username
      );
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
      // Continue even if notification fails
    }

    res.json({
      success: true,
      data: {
        user_id: linkingCode.user_id,
        discord_id,
        username: userProfile?.username || userProfile?.display_name || 'User',
        message: 'Account linked successfully'
      }
    });
  } catch (error) {
    console.error('Error validating linking code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/account-linking/status
 * @desc    Get linking status for authenticated user
 * @access  Private
 */
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const db = await getSupabase();
    
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token.' 
      });
    }

    // Check if user has active code
    const { data: activeCode } = await db
      .from('account_linking_codes')
      .select('code, expires_at, created_at')
      .eq('user_id', user.id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check if user has linked Discord account
    const { data: discordLink } = await db
      .from('discord_users')
      .select('discord_id, username, avatar_url')
      .eq('web_user_id', user.id)
      .limit(1)
      .single();

    res.json({
      success: true,
      data: {
        has_active_code: !!activeCode,
        active_code: activeCode ? {
          code: activeCode.code,
          expires_at: activeCode.expires_at
        } : null,
        is_linked: !!discordLink,
        discord_account: discordLink ? {
          discord_id: discordLink.discord_id,
          username: discordLink.username,
          avatar_url: discordLink.avatar_url
        } : null
      }
    });
  } catch (error) {
    console.error('Error getting linking status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

