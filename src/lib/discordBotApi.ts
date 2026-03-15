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

export async function requestUserDataExport(delivery: 'download' | 'discord_dm') {
  return fetchApi('/discord-bot/user-data-export', {
    method: 'POST',
    body: JSON.stringify({ delivery }),
  });
}
