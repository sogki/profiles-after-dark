import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from '../utils/supabase.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes

// Profiles endpoints
app.get('/api/profiles', async (req, res) => {
  try {
    const { category, type, limit = 20, offset = 0 } = req.query;
    
    let query = supabase
      .from('profiles')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
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

// Emotes endpoints
app.get('/api/emotes', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;
    
    let query = supabase
      .from('emotes')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Error fetching emotes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/emotes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('emotes')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Emote not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching emote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wallpapers endpoints
app.get('/api/wallpapers', async (req, res) => {
  try {
    const { category, resolution, limit = 20, offset = 0 } = req.query;
    
    let query = supabase
      .from('wallpapers')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (resolution) query = query.eq('resolution', resolution);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Error fetching wallpapers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/wallpapers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('wallpapers')
      .select('*, user_profiles:user_id(username, display_name, avatar_url)')
      .eq('id', id)
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

// Discord integration endpoints
app.get('/api/discord/users/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;
    const { data, error } = await supabase
      .from('discord_users')
      .select('*, web_user:web_user_id(*)')
      .eq('discord_id', discordId)
      .single();

    if (error) throw error;

    res.json({ success: true, data: data || null });
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/discord/users', async (req, res) => {
  try {
    const { discord_id, web_user_id, username, discriminator, avatar_url, guild_id } = req.body;

    if (!discord_id || !username || !guild_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('discord_users')
      .upsert({
        discord_id,
        web_user_id,
        username,
        discriminator,
        avatar_url,
        guild_id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'discord_id,guild_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating/updating Discord user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Moderation endpoints
app.get('/api/moderation/cases/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { user_id, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('mod_cases')
      .select('*')
      .eq('guild_id', guildId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (user_id) query = query.eq('user_id', user_id);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Error fetching mod cases:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/moderation/cases', async (req, res) => {
  try {
    const caseData = req.body;

    const { data, error } = await supabase
      .from('mod_cases')
      .insert([caseData])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating mod case:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/moderation/logs/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('mod_logs')
      .select('*')
      .eq('guild_id', guildId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Error fetching mod logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [profiles, emotes, wallpapers, discordUsers] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('emotes').select('id', { count: 'exact', head: true }),
      supabase.from('wallpapers').select('id', { count: 'exact', head: true }),
      supabase.from('discord_users').select('id', { count: 'exact', head: true })
    ]);

    res.json({
      success: true,
      data: {
        profiles: profiles.count || 0,
        emotes: emotes.count || 0,
        wallpapers: wallpapers.count || 0,
        discordUsers: discordUsers.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const results = {
      profiles: [],
      emotes: [],
      wallpapers: []
    };

    if (type === 'all' || type === 'profiles') {
      const { data } = await supabase
        .from('profiles')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.%${q}%,tags.cs.{${q}}`)
        .limit(parseInt(limit));
      results.profiles = data || [];
    }

    if (type === 'all' || type === 'emotes') {
      const { data } = await supabase
        .from('emotes')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.%${q}%,tags.cs.{${q}}`)
        .limit(parseInt(limit));
      results.emotes = data || [];
    }

    if (type === 'all' || type === 'wallpapers') {
      const { data } = await supabase
        .from('wallpapers')
        .select('*, user_profiles:user_id(username, display_name, avatar_url)')
        .or(`title.ilike.%${q}%,tags.cs.{${q}}`)
        .limit(parseInt(limit));
      results.wallpapers = data || [];
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

export default app;


