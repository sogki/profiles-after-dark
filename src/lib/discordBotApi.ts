import { getConfigValue } from './config';
import { supabase } from './supabase';

function normalizeApiRoot(url?: string) {
  const fallback = 'https://dev.profilesafterdark.com';
  const trimmed = (url || fallback).trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed.slice(0, -7) : trimmed;
}

async function getApiBaseUrl() {
  const apiUrl =
    (await getConfigValue('API_URL')) ||
    (await getConfigValue('VITE_API_URL')) ||
    import.meta.env.VITE_API_URL ||
    'https://dev.profilesafterdark.com/api/v1';
  return `${normalizeApiRoot(apiUrl)}/api/v1`;
}

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function fetchApi(path: string, options: RequestInit = {}) {
  const [baseUrl, token] = await Promise.all([getApiBaseUrl(), getAuthToken()]);
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`);
  }

  return body;
}

export async function sendDiscordBotLogEvent(payload: {
  eventType: string;
  title: string;
  description: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  visibility?: 'staff' | 'admin';
}) {
  return fetchApi('/discord-bot/log-event', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDiscordBotDashboard() {
  return fetchApi('/discord-bot/dashboard');
}

export async function getDiscordBotLoggingSettings() {
  return fetchApi('/discord-bot/logging-settings');
}

export async function updateDiscordBotLoggingSettings(settings: Record<string, string>) {
  return fetchApi('/discord-bot/logging-settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

export async function getDiscordGuildChannels() {
  return fetchApi('/discord-bot/channels');
}

export async function getDiscordSetupPresets() {
  return fetchApi('/discord-bot/setup/presets');
}

export async function getDiscordSetupLink() {
  return fetchApi('/discord-bot/setup-link');
}

export async function applyDiscordSetupPreset(presetId: string) {
  return fetchApi('/discord-bot/setup/apply-preset', {
    method: 'POST',
    body: JSON.stringify({ preset_id: presetId }),
  });
}

export async function createDiscordSetupRoles(roles: Array<{
  name: string;
  color?: string;
  hoist?: boolean;
  mentionable?: boolean;
}>) {
  return fetchApi('/discord-bot/setup/roles', {
    method: 'POST',
    body: JSON.stringify({ roles }),
  });
}

export async function postDiscordRulesEmbed(payload: {
  channel_id: string;
  title?: string;
  description?: string;
  rules?: string[];
  color?: string;
}) {
  return fetchApi('/discord-bot/setup/rules-embed', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestUserDataExport(delivery: 'download' | 'discord_dm') {
  return fetchApi('/discord-bot/user-data-export', {
    method: 'POST',
    body: JSON.stringify({ delivery }),
  });
}
