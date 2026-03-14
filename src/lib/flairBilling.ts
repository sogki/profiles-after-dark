import { supabase } from '@/lib/supabase';
import { getConfigValue } from '@/lib/config';

const LOCAL_FLARE_API_FALLBACK = 'http://localhost:3000/api/v1';

function normalizeApiBaseUrl(apiUrl: string) {
  const trimmed = apiUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
  return `${trimmed}/api/v1`;
}

function isLocalFrontendRuntime() {
  if (typeof window === 'undefined') return false;
  return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
}

async function resolveFlairApiBaseUrl() {
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const envLocalApiUrl =
    (import.meta.env.VITE_LOCAL_API_URL as string | undefined) ||
    (import.meta.env.VITE_API_URL_LOCAL as string | undefined);

  if (isLocalFrontendRuntime()) {
    // In local dev, prefer explicitly local API URLs to avoid remote CORS failures.
    return normalizeApiBaseUrl(envLocalApiUrl || LOCAL_FLARE_API_FALLBACK);
  }

  const configuredApiUrl =
    (await getConfigValue('API_URL')) ||
    (await getConfigValue('VITE_API_URL')) ||
    envApiUrl ||
    'https://dev.profilesafterdark.com/api/v1';

  return normalizeApiBaseUrl(configuredApiUrl);
}

export async function createFlairCheckoutSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Please sign in before upgrading.');
  }

  const baseUrl = await resolveFlairApiBaseUrl();
  const response = await fetch(`${baseUrl}/flair-subscriptions/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.success || !result?.data?.url) {
    throw new Error(result?.error || 'Unable to start checkout right now.');
  }

  return result.data.url as string;
}

export async function createFlairBillingPortalSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Please sign in before managing billing.');
  }

  const baseUrl = await resolveFlairApiBaseUrl();
  const response = await fetch(`${baseUrl}/flair-subscriptions/billing-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.success || !result?.data?.url) {
    throw new Error(result?.error || 'Unable to open billing portal right now.');
  }

  return result.data.url as string;
}

