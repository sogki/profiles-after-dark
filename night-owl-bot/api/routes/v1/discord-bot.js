import express from 'express';
import crypto from 'crypto';
import { getSupabase } from '../../../utils/supabase.js';
import { loadConfig } from '../../../utils/config.js';
import { getGuildOverview, sendDiscordEventLog } from '../../../utils/discordAdmin.js';

const router = express.Router();

const LOGGING_CONFIG_KEYS = [
  'DISCORD_LOG_CHANNEL_SUBMISSIONS',
  'DISCORD_LOG_CHANNEL_CONTENT_REVIEW',
  'DISCORD_LOG_CHANNEL_FLAIR',
  'DISCORD_LOG_CHANNEL_ACCOUNT_LINKING',
  'DISCORD_LOG_CHANNEL_ADMIN',
];

function parseRoles(roleValue) {
  if (!roleValue) return [];
  return String(roleValue)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

async function getAuthenticatedUser(req, db) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, profile: null, error: 'Authentication required.' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) {
    return { user: null, profile: null, error: 'Invalid or expired token.' };
  }

  const { data: profile } = await db
    .from('user_profiles')
    .select('user_id, username, display_name, role')
    .eq('user_id', user.id)
    .single();

  return { user, profile, error: null };
}

function ensureStaff(profile) {
  const roles = parseRoles(profile?.role);
  return roles.some((role) => ['admin', 'staff', 'moderator'].includes(role));
}

function ensureAdmin(profile) {
  return parseRoles(profile?.role).includes('admin');
}

function normalizeApiRoot(url) {
  if (!url) return 'http://localhost:3000';
  return String(url).trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');
}

function getSigningSecret(config) {
  return (
    config.EXPORT_LINK_SECRET ||
    config.JWT_SECRET ||
    config.SESSION_SECRET ||
    config.DISCORD_TOKEN ||
    'nightowl-export-fallback-secret'
  );
}

function createExportToken(backupId, expiresAtMs, secret) {
  const payload = `${backupId}:${expiresAtMs}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `${expiresAtMs}.${signature}`;
}

function isValidExportToken(backupId, token, secret) {
  if (!token || typeof token !== 'string') return false;
  const [expiresAtRaw, signature] = token.split('.');
  const expiresAtMs = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAtMs) || !signature) return false;
  if (Date.now() > expiresAtMs) return false;
  const expected = createExportToken(backupId, expiresAtMs, secret).split('.')[1];
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function getDiscordApiHeaders() {
  const config = await loadConfig();
  if (!config.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is not configured.');
  }
  return {
    Authorization: `Bot ${config.DISCORD_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function fetchGuildChannels(guildId) {
  const headers = await getDiscordApiHeaders();
  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to fetch guild channels (${response.status}): ${body}`);
  }

  const channels = await response.json();
  return (Array.isArray(channels) ? channels : [])
    .filter((channel) => [0, 5].includes(channel.type))
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parent_id: channel.parent_id || null,
    }));
}

async function buildUserDataExport(db, user) {
  const [
    profileData,
    profilesData,
    profilePairsData,
    emotesData,
    wallpapersData,
    emojiCombosData,
    collectionsData,
    favoritesData,
    followsData,
    followersData,
    notificationsData,
    downloadsData,
  ] = await Promise.all([
    db.from('user_profiles').select('*').eq('user_id', user.id).single(),
    db.from('profiles').select('*').eq('user_id', user.id),
    db.from('profile_pairs').select('*').eq('user_id', user.id),
    db.from('emotes').select('*').eq('user_id', user.id),
    db.from('wallpapers').select('*').eq('user_id', user.id),
    db.from('emoji_combos').select('*').eq('user_id', user.id),
    db.from('flair_emote_collections').select('*').eq('user_id', user.id),
    db.from('favorites').select('*').eq('user_id', user.id),
    db.from('follows').select('*').eq('follower_id', user.id),
    db.from('follows').select('*').eq('following_id', user.id),
    db.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000),
    db.from('downloads').select('*').eq('user_id', user.id),
  ]);

  const allProfiles = profilesData?.data || [];
  const profilePictures = allProfiles.filter((item) => item.type === 'profile');
  const banners = allProfiles.filter((item) => item.type === 'banner');

  const exportData = {
    version: '2.1',
    createdAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profileData?.data || {},
    content: {
      profilePictures,
      banners,
      profiles: allProfiles,
      profilePairs: profilePairsData?.data || [],
      emotes: emotesData?.data || [],
      wallpapers: wallpapersData?.data || [],
      emojiCombos: emojiCombosData?.data || [],
      collections: collectionsData?.data || [],
    },
    social: {
      favorites: favoritesData?.data || [],
      follows: followsData?.data || [],
      followers: followersData?.data || [],
    },
    activity: {
      notifications: notificationsData?.data || [],
      downloads: downloadsData?.data || [],
    },
    summary: {
      totalContent:
        (allProfiles.length || 0) +
        (profilePairsData?.data?.length || 0) +
        (emotesData?.data?.length || 0) +
        (wallpapersData?.data?.length || 0) +
        (emojiCombosData?.data?.length || 0) +
        (collectionsData?.data?.length || 0),
      totalFavorites: favoritesData?.data?.length || 0,
      totalFollows: followsData?.data?.length || 0,
      totalFollowers: followersData?.data?.length || 0,
      totalCollections: collectionsData?.data?.length || 0,
    },
  };

  return exportData;
}

async function sendDiscordDmToUser(discordId, messageContent) {
  const headers = await getDiscordApiHeaders();
  const createDmResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      recipient_id: discordId,
    }),
  });

  if (!createDmResponse.ok) {
    const body = await createDmResponse.text().catch(() => '');
    throw new Error(`Failed to open DM channel (${createDmResponse.status}): ${body}`);
  }

  const dmChannel = await createDmResponse.json();
  const sendMessageResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: messageContent,
    }),
  });

  if (!sendMessageResponse.ok) {
    const body = await sendMessageResponse.text().catch(() => '');
    throw new Error(`Failed to send DM message (${sendMessageResponse.status}): ${body}`);
  }
}

router.get('/dashboard', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureStaff(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Staff access required.' });
    }

    const config = await loadConfig();
    const guildId = config.GUILD_ID || null;

    const guildOverview = guildId ? await getGuildOverview(guildId) : null;
    const memberCount = guildOverview?.approximate_member_count || 0;
    const onlineCount = guildOverview?.approximate_presence_count || 0;

    const [premiumCountResult, userProfilesResult, linksResult, flairResult] = await Promise.all([
      db
        .from('flair_subscriptions')
        .select('user_id', { count: 'exact', head: true })
        .eq('subscription_tier', 'premium')
        .in('status', ['active', 'trialing']),
      db
        .from('user_profiles')
        .select('user_id, username, display_name, role')
        .order('created_at', { ascending: false })
        .limit(300),
      guildId
        ? db
            .from('discord_users')
            .select('web_user_id, discord_id, username, guild_id')
            .eq('guild_id', guildId)
        : db
            .from('discord_users')
            .select('web_user_id, discord_id, username, guild_id'),
      db
        .from('flair_subscriptions')
        .select('user_id, subscription_tier, status, current_period_end'),
    ]);

    const profiles = userProfilesResult.data || [];
    const links = linksResult.data || [];
    const flair = flairResult.data || [];

    const linkByUser = new Map();
    for (const link of links) {
      if (link.web_user_id && !linkByUser.has(link.web_user_id)) {
        linkByUser.set(link.web_user_id, link);
      }
    }

    const flairByUser = new Map();
    for (const item of flair) {
      flairByUser.set(item.user_id, item);
    }

    const users = profiles.map((profile) => {
      const link = linkByUser.get(profile.user_id);
      const sub = flairByUser.get(profile.user_id);
      return {
        user_id: profile.user_id,
        username: profile.username,
        display_name: profile.display_name,
        linked: !!link,
        discord_id: link?.discord_id || null,
        discord_username: link?.username || null,
        flair_subscription_tier: sub?.subscription_tier || 'free',
        flair_status: sub?.status || 'none',
      };
    });

    const linkedCount = users.filter((user) => user.linked).length;

    return res.json({
      success: true,
      data: {
        guild: {
          id: guildId,
          name: guildOverview?.name || null,
          member_count: memberCount,
          online_count: onlineCount,
        },
        stats: {
          premium_subscribers: premiumCountResult.count || 0,
          linked_users: linkedCount,
          unlinked_users: Math.max(users.length - linkedCount, 0),
          total_users: users.length,
        },
        users,
      },
    });
  } catch (error) {
    console.error('Error loading Discord bot dashboard data:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/logging-settings', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureStaff(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Staff access required.' });
    }

    const { data, error } = await db
      .from('bot_config')
      .select('key, value')
      .in('key', LOGGING_CONFIG_KEYS)
      .order('key', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const settings = {};
    for (const key of LOGGING_CONFIG_KEYS) {
      settings[key] = '';
    }
    for (const item of data || []) {
      settings[item.key] = item.value || '';
    }

    return res.json({ success: true, data: { settings } });
  } catch (error) {
    console.error('Error loading Discord bot logging settings:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/channels', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureStaff(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Staff access required.' });
    }

    const config = await loadConfig();
    const guildId = config.GUILD_ID;
    if (!guildId) {
      return res.status(400).json({ success: false, error: 'GUILD_ID is not configured.' });
    }

    const channels = await fetchGuildChannels(guildId);
    return res.json({ success: true, data: { guild_id: guildId, channels } });
  } catch (error) {
    console.error('Error loading Discord guild channels:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/logging-settings', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureAdmin(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    const payload = req.body?.settings || {};
    const rows = LOGGING_CONFIG_KEYS
      .filter((key) => Object.prototype.hasOwnProperty.call(payload, key))
      .map((key) => ({
        key,
        value: String(payload[key] || '').trim(),
        description: `Discord bot logging channel for ${key.toLowerCase()}`,
        category: 'discord',
        is_secret: false,
      }));

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No logging settings were provided.' });
    }

    const { error } = await db
      .from('bot_config')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving Discord bot logging settings:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/log-event', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }

    const {
      eventType = 'system',
      title,
      description,
      fields = [],
      visibility = 'staff',
    } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'title and description are required.' });
    }

    const actor = auth.profile?.display_name || auth.profile?.username || auth.user?.email || auth.user?.id;
    const actorField = { name: 'Actor', value: String(actor), inline: true };

    const result = await sendDiscordEventLog({
      eventType,
      title,
      description,
      fields: [actorField, ...(Array.isArray(fields) ? fields : [])],
      visibility: visibility === 'admin' ? 'admin' : 'staff',
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending Discord log event:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/user-data-export', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }

    const delivery = req.body?.delivery === 'discord_dm' ? 'discord_dm' : 'download';
    const exportData = await buildUserDataExport(db, auth.user);

    const { data: backupRow, error: backupError } = await db
      .from('account_backups')
      .insert({
        user_id: auth.user.id,
        backup_data: exportData,
        version: exportData.version,
      })
      .select('id, created_at')
      .single();

    if (backupError || !backupRow) {
      return res.status(500).json({
        success: false,
        error: backupError?.message || 'Failed to create backup record.',
      });
    }

    const fileName = `account-export-${new Date().toISOString().split('T')[0]}.json`;

    if (delivery === 'discord_dm') {
      const config = await loadConfig();
      const guildId = config.GUILD_ID || null;

      const linkedQuery = db
        .from('discord_users')
        .select('discord_id, guild_id')
        .eq('web_user_id', auth.user.id)
        .limit(1);
      const { data: linkedRows } = guildId
        ? await linkedQuery.eq('guild_id', guildId)
        : await linkedQuery;

      const link = linkedRows?.[0];
      if (!link?.discord_id) {
        return res.status(400).json({
          success: false,
          error: 'No linked Discord account found. Link your account first.',
        });
      }

      const expiresAtMs = Date.now() + 24 * 60 * 60 * 1000;
      const secret = getSigningSecret(config);
      const token = createExportToken(backupRow.id, expiresAtMs, secret);
      const apiRoot = normalizeApiRoot(config.API_URL || config.BACKEND_URL || 'http://localhost:3000');
      const exportLink = `${apiRoot}/api/v1/discord-bot/exports/${backupRow.id}?token=${encodeURIComponent(token)}`;

      await sendDiscordDmToUser(
        link.discord_id,
        `Your Profiles After Dark data export is ready.\n\nDownload link (expires in 24h): ${exportLink}`
      );

      return res.json({
        success: true,
        data: {
          delivery: 'discord_dm',
          file_name: fileName,
          expires_at: new Date(expiresAtMs).toISOString(),
        },
      });
    }

    return res.json({
      success: true,
      data: {
        delivery: 'download',
        file_name: fileName,
        export_data: exportData,
      },
    });
  } catch (error) {
    console.error('Error creating user data export:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/exports/:backupId', async (req, res) => {
  try {
    const { backupId } = req.params;
    const token = req.query?.token;
    const config = await loadConfig();
    const secret = getSigningSecret(config);

    if (!isValidExportToken(backupId, token, secret)) {
      return res.status(403).json({ success: false, error: 'Invalid or expired export token.' });
    }

    const db = await getSupabase();
    const { data: backup, error } = await db
      .from('account_backups')
      .select('id, backup_data, created_at')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      return res.status(404).json({ success: false, error: 'Backup not found.' });
    }

    const fileName = `account-export-${String(backup.created_at || '').slice(0, 10) || 'latest'}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(JSON.stringify(backup.backup_data, null, 2));
  } catch (error) {
    console.error('Error serving signed export download:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
