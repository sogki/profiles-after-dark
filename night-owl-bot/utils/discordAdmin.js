import { loadConfig } from './config.js';

function buildAuthHeaders(botToken, reason) {
  const headers = {
    Authorization: `Bot ${botToken}`,
    'Content-Type': 'application/json',
  };

  if (reason) {
    headers['X-Audit-Log-Reason'] = encodeURIComponent(reason).slice(0, 512);
  }

  return headers;
}

function getPremiumRoleId(config) {
  return (
    config.PREMIUM_ROLE_ID ||
    config.FLAIR_PREMIUM_ROLE_ID ||
    null
  );
}

export async function addMemberRole({ guildId, userId, roleId, reason }) {
  const config = await loadConfig();
  const botToken = config.DISCORD_TOKEN;

  if (!botToken || !guildId || !userId || !roleId) {
    return { success: false, skipped: true, error: 'Missing bot token, guild, user, or role id.' };
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'PUT',
      headers: buildAuthHeaders(botToken, reason),
    });
  } catch (error) {
    return { success: false, skipped: false, error: `Discord role add request failed: ${error.message}` };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { success: false, skipped: false, error: `Discord role add failed: ${response.status} ${body}` };
  }

  return { success: true };
}

export async function removeMemberRole({ guildId, userId, roleId, reason }) {
  const config = await loadConfig();
  const botToken = config.DISCORD_TOKEN;

  if (!botToken || !guildId || !userId || !roleId) {
    return { success: false, skipped: true, error: 'Missing bot token, guild, user, or role id.' };
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'DELETE',
      headers: buildAuthHeaders(botToken, reason),
    });
  } catch (error) {
    return { success: false, skipped: false, error: `Discord role remove request failed: ${error.message}` };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { success: false, skipped: false, error: `Discord role remove failed: ${response.status} ${body}` };
  }

  return { success: true };
}

export async function getGuildOverview(guildId) {
  const config = await loadConfig();
  const botToken = config.DISCORD_TOKEN;
  if (!botToken || !guildId) return null;

  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
    headers: buildAuthHeaders(botToken),
  });

  if (!response.ok) return null;
  return response.json();
}

function resolveLogChannel(config, eventType, visibility = 'staff') {
  if (visibility === 'admin') {
    return config.DISCORD_LOG_CHANNEL_ADMIN || config.STAFF_LOG_CHANNEL_ID || null;
  }

  const map = {
    content_submission: config.DISCORD_LOG_CHANNEL_SUBMISSIONS,
    content_review: config.DISCORD_LOG_CHANNEL_CONTENT_REVIEW || config.STAFF_LOG_CHANNEL_ID,
    flair_subscription: config.DISCORD_LOG_CHANNEL_FLAIR || config.DISCORD_LOG_CHANNEL_ADMIN || config.STAFF_LOG_CHANNEL_ID,
    account_linking: config.DISCORD_LOG_CHANNEL_ACCOUNT_LINKING || config.STAFF_LOG_CHANNEL_ID,
    system: config.DISCORD_LOG_CHANNEL_ADMIN || config.STAFF_LOG_CHANNEL_ID,
  };

  return map[eventType] || config.STAFF_LOG_CHANNEL_ID || null;
}

export async function sendDiscordEventLog({
  eventType = 'system',
  title,
  description,
  fields = [],
  visibility = 'staff',
}) {
  const config = await loadConfig();
  const botToken = config.DISCORD_TOKEN;
  const channelId = resolveLogChannel(config, eventType, visibility);

  if (!botToken || !channelId) {
    return { success: false, skipped: true, error: 'Discord bot token or log channel is not configured.' };
  }

  const colorMap = {
    content_submission: 0xf59e0b,
    content_review: 0x3b82f6,
    flair_subscription: 0x8b5cf6,
    account_linking: 0x10b981,
    system: 0xef4444,
  };

  const payload = {
    embeds: [
      {
        title: title || 'Bot Event',
        description: description || 'No description provided.',
        color: colorMap[eventType] || 0x64748b,
        fields: (fields || []).slice(0, 25).map((field) => ({
          name: String(field.name || 'Info').slice(0, 256),
          value: String(field.value || '-').slice(0, 1024),
          inline: !!field.inline,
        })),
        timestamp: new Date().toISOString(),
      },
    ],
  };

  let response;
  try {
    response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: buildAuthHeaders(botToken),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { success: false, skipped: false, error: `Discord log request failed: ${error.message}` };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { success: false, skipped: false, error: `Failed to send Discord log: ${response.status} ${body}` };
  }

  return { success: true };
}

export function getPremiumRoleConfig(config) {
  return {
    guildId: config.GUILD_ID || null,
    roleId: getPremiumRoleId(config),
  };
}
