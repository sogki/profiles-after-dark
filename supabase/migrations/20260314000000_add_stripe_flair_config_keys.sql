-- Add Stripe configuration keys for Flair subscriptions
-- NOTE: Values are intentionally placeholders; set real values in Supabase after migration.

INSERT INTO public.bot_config (key, value, description, category, is_secret, encrypted)
VALUES
  (
    'STRIPE_PUBLISHABLE_KEY',
    '',
    'Stripe publishable key for client-side checkout initialization',
    'external',
    false,
    false
  ),
  (
    'STRIPE_SECRET_KEY',
    '',
    'Stripe secret key used by backend for checkout session and webhook handling',
    'external',
    true,
    false
  ),
  (
    'STRIPE_WEBHOOK_SECRET',
    '',
    'Stripe webhook signing secret for verifying webhook payloads',
    'external',
    true,
    false
  ),
  (
    'FLAIR_PREMIUM_PRICE_GBP',
    '3.99',
    'Monthly Flair Premium subscription price in GBP',
    'external',
    false,
    false
  )
ON CONFLICT (key) DO NOTHING;

