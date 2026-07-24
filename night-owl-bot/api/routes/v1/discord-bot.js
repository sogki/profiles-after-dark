import express from 'express';
import crypto from 'crypto';
import { getSupabase } from '../../../utils/supabase.js';
import { loadConfig, setConfig } from '../../../utils/config.js';
import { getGuildOverview, sendDiscordEventLog } from '../../../utils/discordAdmin.js';

const router = express.Router();

const LOGGING_CONFIG_KEYS = [
  'DISCORD_LOG_CHANNEL_SUBMISSIONS',
  'DISCORD_LOG_CHANNEL_CONTENT_REVIEW',
  'DISCORD_LOG_CHANNEL_FLAIR',
  'DISCORD_LOG_CHANNEL_ACCOUNT_LINKING',
  'DISCORD_LOG_CHANNEL_ADMIN',
];

const SETUP_PRESETS = {
  balanced: {
    id: 'balanced',
    name: 'Balanced Community',
    description: 'A practical default: onboarding, content channels, gallery, and moderation.',
    categories: [
      {
        key: 'server',
        name: '✦ PAD SERVER ✦',
        channels: [
          { key: 'welcome', name: '✦ welcome lounge', topic: 'Welcome and onboarding.' },
          { key: 'rules', name: '✦ rules & guidelines', topic: 'Server rules and guidelines.' },
          { key: 'reaction_roles', name: '✦ role studio', topic: 'Self-assign server roles.' },
        ],
      },
      {
        key: 'content',
        name: '✦ PAD CONTENT ✦',
        channels: [
          { key: 'content_hub', name: '✦ content hub', topic: 'General content activity.' },
          { key: 'content_pfp_banner', name: '✦ pfp + banners', topic: 'Profile pictures and banners.' },
          { key: 'content_profile_pairs', name: '✦ profile pairs', topic: 'Profile pair content.' },
          { key: 'content_emotes', name: '✦ emotes', topic: 'Emote content.' },
          { key: 'content_wallpapers', name: '✦ wallpapers', topic: 'Wallpaper content.' },
          { key: 'content_emoji_combos', name: '✦ emoji combos', topic: 'Emoji combo content.' },
          { key: 'content_collections', name: '✦ collections', topic: 'Collection and bundle content.' },
        ],
      },
      {
        key: 'gallery',
        name: '✦ PAD SHOWCASE ✦',
        channels: [
          { key: 'showcase_hub', name: '✦ showcase feed', topic: 'Featured and approved content.' },
          { key: 'showcase_pfp_banner', name: '✦ showcase pfp + banner', topic: 'Featured profile pictures and banners.' },
          { key: 'showcase_profile_pairs', name: '✦ showcase profile pairs', topic: 'Featured profile pairs.' },
          { key: 'showcase_emotes', name: '✦ showcase emotes', topic: 'Featured emotes.' },
          { key: 'showcase_wallpapers', name: '✦ showcase wallpapers', topic: 'Featured wallpapers.' },
          { key: 'showcase_emoji_combos', name: '✦ showcase emoji combos', topic: 'Featured emoji combos.' },
          { key: 'showcase_collections', name: '✦ showcase collections', topic: 'Featured collections.' },
        ],
      },
      {
        key: 'moderation',
        name: '✦ PAD MODERATION ✦',
        channels: [
          { key: 'content_review', name: '✦ content review desk', topic: 'Staff content review workflow.' },
          { key: 'mod_logs', name: '✦ moderation logs', topic: 'Moderation actions and deleted message logs.' },
          { key: 'admin_logs', name: '✦ admin diagnostics', topic: 'Bot/system admin and diagnostics.' },
        ],
      },
    ],
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Setup',
    description: 'Small footprint with essentials for onboarding, showcase, and moderation.',
    categories: [
      {
        key: 'server',
        name: '— PAD SERVER —',
        channels: [
          { key: 'welcome', name: 'welcome space', topic: 'Welcome and onboarding.' },
          { key: 'rules', name: 'rules board', topic: 'Server rules and guidelines.' },
        ],
      },
      {
        key: 'gallery',
        name: '— PAD GALLERY —',
        channels: [
          { key: 'showcase_hub', name: 'showcase lounge', topic: 'Featured and approved content.' },
        ],
      },
      {
        key: 'moderation',
        name: '— PAD MODERATION —',
        channels: [
          { key: 'content_review', name: 'review desk', topic: 'Staff content review workflow.' },
          { key: 'mod_logs', name: 'mod logs', topic: 'Moderation actions and deleted message logs.' },
        ],
      },
    ],
  },
  showcase: {
    id: 'showcase',
    name: 'Showcase Heavy',
    description: 'Presentation-focused layout with dedicated public showcase channels.',
    categories: [
      {
        key: 'server',
        name: '✧ PAD WELCOME ✧',
        channels: [
          { key: 'welcome', name: '✧ welcome atelier', topic: 'Welcome and onboarding.' },
          { key: 'rules', name: '✧ rules gallery', topic: 'Server rules and guidelines.' },
          { key: 'reaction_roles', name: '✧ role palette', topic: 'Self-assign server roles.' },
        ],
      },
      {
        key: 'showcase',
        name: '✧ PAD SHOWCASE ✧',
        channels: [
          { key: 'showcase_pfp_banner', name: '✧ pfp + banner drops', topic: 'Featured profile pictures and banners.' },
          { key: 'showcase_profile_pairs', name: '✧ profile pair drops', topic: 'Featured profile pairs.' },
          { key: 'showcase_emotes', name: '✧ emote drops', topic: 'Featured emotes.' },
          { key: 'showcase_wallpapers', name: '✧ wallpaper drops', topic: 'Featured wallpapers.' },
          { key: 'showcase_emoji_combos', name: '✧ emoji combo drops', topic: 'Featured emoji combos.' },
          { key: 'showcase_collections', name: '✧ collection drops', topic: 'Featured collections.' },
        ],
      },
      {
        key: 'moderation',
        name: '✧ PAD STAFF ✧',
        channels: [
          { key: 'content_review', name: '✧ review atelier', topic: 'Staff content review workflow.' },
          { key: 'mod_logs', name: '✧ moderation journal', topic: 'Moderation actions and deleted message logs.' },
          { key: 'admin_logs', name: '✧ diagnostics lab', topic: 'Bot/system admin and diagnostics.' },
        ],
      },
    ],
  },
};

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

function createSetupToken(userId, guildId, expiresAtMs, secret) {
  const payload = `${userId}:${guildId}:${expiresAtMs}`;
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

async function discordApiRequest(path, options = {}) {
  const headers = await getDiscordApiHeaders();
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Discord API request failed (${response.status}): ${body}`);
  }

  if (response.status === 204) return null;
  return response.json().catch(() => ({}));
}

function parseRoleColor(colorRaw) {
  const fallback = 0x8b5cf6;
  if (!colorRaw || typeof colorRaw !== 'string') return fallback;
  const normalized = colorRaw.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;
  return parseInt(normalized, 16);
}

function getWebRoot(config) {
  const raw = config.DEV_WEB_URL || 'https://dev.profilesafterdark.com';
  return String(raw).trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');
}

function toDiscordChannelName(value) {
  const base = String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  const sanitized = base.replace(/[^a-z0-9\-_~\u00a1-\uffff]/g, '');
  return (sanitized || 'channel').slice(0, 100);
}

async function applySetupPreset(guildId, preset) {
  const existing = await discordApiRequest(`/guilds/${guildId}/channels`);
  const channels = Array.isArray(existing) ? existing : [];
  const categoryByName = new Map(
    channels
      .filter((channel) => channel.type === 4)
      .map((channel) => [String(channel.name || '').toLowerCase(), channel])
  );

  const categoryMap = {};
  const channelMap = {};
  const created = { categories: [], channels: [] };

  for (const category of preset.categories) {
    const lookup = category.name.toLowerCase();
    let categoryChannel = categoryByName.get(lookup);

    if (!categoryChannel) {
      categoryChannel = await discordApiRequest(`/guilds/${guildId}/channels`, {
        method: 'POST',
        body: {
          name: category.name,
          type: 4,
        },
      });
      created.categories.push(category.name);
      categoryByName.set(lookup, categoryChannel);
    }

    categoryMap[category.key] = categoryChannel.id;

    for (const item of category.channels) {
      const desiredChannelName = toDiscordChannelName(item.name);
      const found = channels.find(
        (channel) =>
          channel.type === 0 &&
          String(channel.name || '').toLowerCase() === desiredChannelName &&
          String(channel.parent_id || '') === String(categoryChannel.id)
      );

      let textChannel = found || null;
      if (!textChannel) {
        textChannel = await discordApiRequest(`/guilds/${guildId}/channels`, {
          method: 'POST',
          body: {
            name: desiredChannelName,
            type: 0,
            parent_id: categoryChannel.id,
            topic: item.topic || null,
          },
        });
        created.channels.push(item.name);
      } else if (item.topic && item.topic !== textChannel.topic) {
        await discordApiRequest(`/channels/${textChannel.id}`, {
          method: 'PATCH',
          body: { topic: item.topic },
        }).catch(() => undefined);
      }

      channelMap[item.key] = textChannel.id;
    }
  }

  return {
    categoryMap,
    channelMap,
    created,
  };
}

async function persistSetupMapsAndDefaults(guildId, categoryMap, channelMap) {
  await setConfig(
    'DISCORD_SETUP_CATEGORY_MAP',
    JSON.stringify(categoryMap || {}),
    'Profiles After Dark setup category map (key -> Discord category ID)',
    'discord',
    false
  );
  await setConfig(
    'DISCORD_SETUP_CHANNEL_MAP',
    JSON.stringify(channelMap || {}),
    'Profiles After Dark setup channel map (key -> Discord channel ID)',
    'discord',
    false
  );

  const updates = [
    ['DISCORD_CHANNEL_WELCOME_ID', channelMap.welcome || ''],
    ['DISCORD_CHANNEL_RULES_ID', channelMap.rules || ''],
    ['DISCORD_CHANNEL_REACTION_ROLES_ID', channelMap.reaction_roles || ''],
    ['DISCORD_CHANNEL_CONTENT_SUBMISSIONS_ID', channelMap.content_hub || ''],
    ['DISCORD_CHANNEL_GALLERY_SHOWCASE_ID', channelMap.showcase_hub || channelMap.showcase_pfp_banner || ''],
    ['DISCORD_CHANNEL_CONTENT_REVIEW_ID', channelMap.content_review || ''],
    ['DISCORD_LOG_CHANNEL_SUBMISSIONS', channelMap.content_hub || ''],
    ['DISCORD_LOG_CHANNEL_CONTENT_REVIEW', channelMap.content_review || ''],
    ['DISCORD_LOG_CHANNEL_ADMIN', channelMap.admin_logs || ''],
  ];

  for (const [key, value] of updates) {
    await setConfig(
      key,
      String(value || ''),
      `Profiles After Dark setup managed key for ${key}`,
      'discord',
      false
    );
  }

  if (channelMap.mod_logs) {
    await dbSetModlogsChannel(guildId, channelMap.mod_logs);
  }
}

async function dbSetModlogsChannel(guildId, channelId) {
  const db = await getSupabase();
  await db.from('modlogs_channels').upsert(
    { guild_id: guildId, channel_id: channelId, enabled: true },
    { onConflict: 'guild_id' }
  );
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

router.get('/setup/presets', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureStaff(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Staff access required.' });
    }

    const presets = Object.values(SETUP_PRESETS).map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      categories: preset.categories.length,
      channels: preset.categories.reduce((sum, item) => sum + item.channels.length, 0),
    }));

    return res.json({ success: true, data: { presets } });
  } catch (error) {
    console.error('Error loading setup presets:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/setup-link', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureAdmin(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    const config = await loadConfig();
    const guildId = String(config.GUILD_ID || '').trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: 'GUILD_ID is not configured.' });
    }

    const expiresAtMs = Date.now() + 30 * 60 * 1000;
    const secret = getSigningSecret(config);
    const setupToken = createSetupToken(auth.user.id, guildId, expiresAtMs, secret);
    const webRoot = getWebRoot(config);
    const dashboardUrl = `${webRoot}/dashboards/discord-bot?discord_setup=1&guild_id=${encodeURIComponent(guildId)}&setup_token=${encodeURIComponent(setupToken)}&expires_at=${encodeURIComponent(new Date(expiresAtMs).toISOString())}`;

    return res.json({
      success: true,
      data: {
        url: dashboardUrl,
        guild_id: guildId,
        expires_at: new Date(expiresAtMs).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating secure setup link:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/setup/roles', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureAdmin(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    const config = await loadConfig();
    const guildId = String(config.GUILD_ID || '').trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: 'GUILD_ID is not configured.' });
    }

    const inputRoles = Array.isArray(req.body?.roles) ? req.body.roles : [];
    if (inputRoles.length === 0) {
      return res.status(400).json({ success: false, error: 'roles[] is required.' });
    }

    const guildRoles = await discordApiRequest(`/guilds/${guildId}/roles`);
    const existingByName = new Map(
      (Array.isArray(guildRoles) ? guildRoles : []).map((role) => [String(role.name || '').toLowerCase(), role])
    );

    const results = [];
    for (const roleInput of inputRoles.slice(0, 25)) {
      const name = String(roleInput?.name || '').trim();
      if (!name) continue;

      const existing = existingByName.get(name.toLowerCase());
      if (existing) {
        results.push({ id: existing.id, name: existing.name, created: false });
        continue;
      }

      const created = await discordApiRequest(`/guilds/${guildId}/roles`, {
        method: 'POST',
        body: {
          name,
          color: parseRoleColor(roleInput?.color),
          hoist: !!roleInput?.hoist,
          mentionable: !!roleInput?.mentionable,
        },
      });

      results.push({
        id: created.id,
        name: created.name,
        created: true,
      });
    }

    return res.json({ success: true, data: { roles: results } });
  } catch (error) {
    console.error('Error creating setup roles:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/setup/rules-embed', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureAdmin(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    const title = String(req.body?.title || 'Server Rules').trim();
    const description = String(req.body?.description || '').trim();
    const channelId = String(req.body?.channel_id || '').trim();
    const rules = Array.isArray(req.body?.rules)
      ? req.body.rules.map((rule) => String(rule || '').trim()).filter(Boolean)
      : [];
    const color = parseRoleColor(req.body?.color || '#3b82f6');

    if (!channelId) {
      return res.status(400).json({ success: false, error: 'channel_id is required.' });
    }
    if (!description && rules.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide description or rules.' });
    }

    const embed = {
      title: title.slice(0, 256),
      description: (description || rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')).slice(0, 4096),
      color,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Profiles After Dark - Rules',
      },
    };

    const message = await discordApiRequest(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: {
        embeds: [embed],
      },
    });

    await setConfig(
      'DISCORD_CHANNEL_RULES_ID',
      channelId,
      'Discord channel ID for server rules',
      'discord',
      false
    );

    return res.json({
      success: true,
      data: {
        message_id: message?.id || null,
        channel_id: channelId,
      },
    });
  } catch (error) {
    console.error('Error posting rules embed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/setup/apply-preset', async (req, res) => {
  try {
    const db = await getSupabase();
    const auth = await getAuthenticatedUser(req, db);
    if (auth.error) {
      return res.status(401).json({ success: false, error: auth.error });
    }
    if (!ensureAdmin(auth.profile)) {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    const config = await loadConfig();
    const guildId = String(config.GUILD_ID || '').trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: 'GUILD_ID is not configured.' });
    }

    const presetId = String(req.body?.preset_id || 'balanced').trim().toLowerCase();
    const preset = SETUP_PRESETS[presetId];
    if (!preset) {
      return res.status(400).json({ success: false, error: `Unknown preset_id: ${presetId}` });
    }

    const result = await applySetupPreset(guildId, preset);
    await persistSetupMapsAndDefaults(guildId, result.categoryMap, result.channelMap);

    return res.json({
      success: true,
      data: {
        preset: {
          id: preset.id,
          name: preset.name,
        },
        created: result.created,
        category_map: result.categoryMap,
        channel_map: result.channelMap,
      },
    });
  } catch (error) {
    console.error('Error applying setup preset:', error);
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
