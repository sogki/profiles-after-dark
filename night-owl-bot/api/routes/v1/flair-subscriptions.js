import express from 'express';
import Stripe from 'stripe';
import { getSupabase } from '../../../utils/supabase.js';
import { loadConfig } from '../../../utils/config.js';
import { sendDiscordEventLog } from '../../../utils/discordAdmin.js';
import { syncPremiumRoleForUserLinks } from '../../../utils/premiumRoleSync.js';

const router = express.Router();

function normalizeSubscriptionStatus(status) {
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  if (status === 'past_due') return 'past_due';
  return 'canceled';
}

function toIsoFromUnix(unixSeconds) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function normalizeBaseUrl(value, fallback) {
  const source = value && value.trim() ? value : fallback;
  return source.replace(/\/+$/, '');
}

async function getAuthenticatedUser(req, db) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Authentication required.' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: 'Invalid or expired token.' };
  }

  return { user, error: null };
}

async function getStripeContext() {
  const config = await loadConfig();
  const stripeSecretKey = config.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error('Stripe is not configured. Missing STRIPE_SECRET_KEY in bot_config.');
  }

  const stripe = new Stripe(stripeSecretKey);
  const monthlyPriceGbp = Number.parseFloat(
    config.FLAIR_PREMIUM_PRICE_GBP || config.FLAIR_PREMIUM_PRICE_USD || '3.99'
  );
  const unitAmount = Number.isFinite(monthlyPriceGbp)
    ? Math.max(100, Math.round(monthlyPriceGbp * 100))
    : 399;

  return { stripe, config, unitAmount };
}

async function upsertFlairSubscriptionFromStripe(db, payload) {
  const {
    userId,
    stripeSubscriptionId,
    stripeCustomerId,
    stripeStatus,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  } = payload;

  const normalizedStatus = normalizeSubscriptionStatus(stripeStatus);
  const subscriptionTier =
    normalizedStatus === 'active' || normalizedStatus === 'trialing'
      ? 'premium'
      : 'free';

  const { error } = await db
    .from('flair_subscriptions')
    .upsert(
      {
        user_id: userId,
        subscription_tier: subscriptionTier,
        stripe_subscription_id: stripeSubscriptionId || null,
        stripe_customer_id: stripeCustomerId || null,
        status: normalizedStatus,
        current_period_start: currentPeriodStart || null,
        current_period_end: currentPeriodEnd || null,
        cancel_at_period_end: !!cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw error;
  }
}

async function createSubscriptionNotification(db, userId, notification) {
  if (!userId) return;
  try {
    const message = notification.message || 'Subscription update';
    await db
      .from('notifications')
      .insert({
        user_id: userId,
        title: notification.title,
        message,
        content: message,
        type: notification.type || 'system',
        read: false,
        action_url: notification.actionUrl || '/billing',
        metadata: notification.metadata || {},
      });
  } catch (error) {
    console.warn('Failed to create subscription notification:', error?.message || error);
  }
}

async function createUniqueRenewalReminder(db, userId, currentPeriodEndIso) {
  if (!userId || !currentPeriodEndIso) return;
  try {
    const { data: existing } = await db
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('metadata->>event', 'subscription_renewal_7d')
      .eq('metadata->>current_period_end', currentPeriodEndIso)
      .limit(1);

    if (existing && existing.length > 0) return;

    await createSubscriptionNotification(db, userId, {
      title: 'Flair Premium renews soon',
      message: 'Your Flair Premium subscription renews in less than 7 days. Review billing if you need to make changes.',
      type: 'info',
      actionUrl: '/billing',
      metadata: {
        event: 'subscription_renewal_7d',
        current_period_end: currentPeriodEndIso,
      },
    });
  } catch (error) {
    console.warn('Failed to queue renewal reminder:', error?.message || error);
  }
}

/**
 * @route   POST /api/v1/flair-subscriptions/checkout-session
 * @desc    Create Stripe Checkout session for Flair Premium
 * @access  Private
 */
router.post('/checkout-session', async (req, res) => {
  try {
    const db = await getSupabase();
    const { user, error: authError } = await getAuthenticatedUser(req, db);
    if (authError) {
      return res.status(401).json({ success: false, error: authError });
    }

    const { stripe, config, unitAmount } = await getStripeContext();
    const webUrl = normalizeBaseUrl(config.WEB_URL, 'https://profilesafterdark.com');

    const { data: existingSubscription } = await db
      .from('flair_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let stripeCustomerId = existingSubscription?.stripe_customer_id || null;

    if (!stripeCustomerId) {
      const customerEmail = user.email || undefined;
      if (customerEmail) {
        const existingCustomers = await stripe.customers.list({
          email: customerEmail,
          limit: 10,
        });

        const matchedCustomer = existingCustomers.data.find(
          (customer) => customer.metadata?.supabase_user_id === user.id
        );
        stripeCustomerId = matchedCustomer?.id || existingCustomers.data[0]?.id || null;
      }
    }

    if (!stripeCustomerId) {
      const createdCustomer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = createdCustomer.id;
    } else {
      await stripe.customers.update(stripeCustomerId, {
        metadata: {
          supabase_user_id: user.id,
        },
      });
    }

    await db
      .from('flair_subscriptions')
      .upsert(
        {
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          subscription_tier: 'free',
          status: 'active',
        },
        { onConflict: 'user_id' }
      );

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: unitAmount,
            recurring: {
              interval: 'month',
            },
            product_data: {
              name: 'Flair Premium',
              description: 'Premium customization for Profiles After Dark',
            },
          },
        },
      ],
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      allow_promotion_codes: true,
      success_url: `${webUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${webUrl}/flair?checkout=cancelled`,
    });

    return res.json({
      success: true,
      data: {
        session_id: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Error creating Flair Stripe checkout session:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session.',
    });
  }
});

/**
 * @route   POST /api/v1/flair-subscriptions/billing-portal-session
 * @desc    Create Stripe Billing Portal session for active subscribers
 * @access  Private
 */
router.post('/billing-portal-session', async (req, res) => {
  try {
    const db = await getSupabase();
    const { user, error: authError } = await getAuthenticatedUser(req, db);
    if (authError) {
      return res.status(401).json({ success: false, error: authError });
    }

    const { stripe, config } = await getStripeContext();
    const webUrl = normalizeBaseUrl(config.WEB_URL, 'https://profilesafterdark.com');

    const { data: subscription, error: subError } = await db
      .from('flair_subscriptions')
      .select('stripe_customer_id, subscription_tier, status')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return res.status(400).json({
        success: false,
        error: 'No Stripe customer found for this account yet.',
      });
    }

    if (subscription.subscription_tier !== 'premium') {
      return res.status(400).json({
        success: false,
        error: 'Upgrade to Premium before opening billing management.',
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${webUrl}/billing`,
    });

    return res.json({
      success: true,
      data: {
        url: portalSession.url,
      },
    });
  } catch (error) {
    console.error('Error creating Stripe billing portal session:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to open billing portal.',
    });
  }
});

/**
 * @route   POST /api/v1/flair-subscriptions/webhook
 * @desc    Stripe webhook handler for Flair subscription updates
 * @access  Public (verified by Stripe signature when configured)
 */
export async function handleFlairStripeWebhook(req, res) {
  try {
    const db = await getSupabase();
    const { stripe, config } = await getStripeContext();
    const webhookSecret = config.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers['stripe-signature'];

    let event = req.body;

    if (webhookSecret && signature && req.rawBody) {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session?.metadata?.user_id;

      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await upsertFlairSubscriptionFromStripe(db, {
          userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id,
          stripeStatus: subscription.status,
          currentPeriodStart: toIsoFromUnix(subscription.current_period_start),
          currentPeriodEnd: toIsoFromUnix(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        await createSubscriptionNotification(db, userId, {
          title: 'Welcome to Flair Premium!',
          message:
            'You are officially Premium. Your custom display name effects, advanced flair controls, and exclusive personalization options are now unlocked. We are glad to have you here.',
          type: 'success',
          actionUrl: '/profile-settings?tab=flair',
          metadata: {
            event: 'subscription_welcome',
            stripe_subscription_id: subscription.id,
          },
        });

        // Keep Discord premium role in sync with latest billing state.
        try {
          await syncPremiumRoleForUserLinks({
            db,
            webUserId: userId,
            source: 'stripe-checkout-completed',
          });
        } catch (error) {
          console.error('Failed to sync premium role on checkout completion:', error);
        }

        try {
          await sendDiscordEventLog({
            eventType: 'flair_subscription',
            title: 'Flair Premium Activated',
            description: 'A user successfully completed Flair Premium checkout.',
            fields: [
              { name: 'User ID', value: userId, inline: true },
              { name: 'Subscription ID', value: subscription.id, inline: true },
              { name: 'Status', value: subscription.status, inline: true },
            ],
            visibility: 'admin',
          });
        } catch (error) {
          console.error('Failed to log checkout completion event to Discord:', error);
        }
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object;
      const stripeCustomerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

      let userId = subscription?.metadata?.user_id || null;
      if (!userId && stripeCustomerId) {
        const { data: existing } = await db
          .from('flair_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();
        userId = existing?.user_id || null;
      }

      if (userId) {
        await upsertFlairSubscriptionFromStripe(db, {
          userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId,
          stripeStatus: subscription.status,
          currentPeriodStart: toIsoFromUnix(subscription.current_period_start),
          currentPeriodEnd: toIsoFromUnix(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });

        try {
          await syncPremiumRoleForUserLinks({
            db,
            webUserId: userId,
            source: `stripe-${event.type}`,
          });
        } catch (error) {
          console.error('Failed to sync premium role from Stripe event:', error);
        }

        const status = normalizeSubscriptionStatus(subscription.status);
        const currentPeriodEndIso = toIsoFromUnix(subscription.current_period_end);

        if (status === 'past_due') {
          await createSubscriptionNotification(db, userId, {
            title: 'Subscription payment failed',
            message: 'We could not process your Flair Premium payment. Please update your payment method.',
            type: 'warning',
            actionUrl: '/billing',
            metadata: {
              event: 'subscription_payment_failed',
              stripe_subscription_id: subscription.id,
            },
          });
        }

        if (status === 'canceled') {
          await createSubscriptionNotification(db, userId, {
            title: 'Subscription canceled',
            message: 'Your Flair Premium subscription has been canceled.',
            type: 'system',
            actionUrl: '/flair',
            metadata: {
              event: 'subscription_canceled',
              stripe_subscription_id: subscription.id,
            },
          });
        }

        if ((status === 'active' || status === 'trialing') && currentPeriodEndIso) {
          const daysUntilRenewal = Math.ceil(
            (new Date(currentPeriodEndIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilRenewal > 0 && daysUntilRenewal <= 7) {
            await createUniqueRenewalReminder(db, userId, currentPeriodEndIso);
          }
        }

        try {
          await sendDiscordEventLog({
            eventType: 'flair_subscription',
            title: 'Flair Subscription Updated',
            description: `Stripe subscription event received: ${event.type}`,
            fields: [
              { name: 'User ID', value: userId, inline: true },
              { name: 'Subscription ID', value: subscription.id, inline: true },
              { name: 'Status', value: status, inline: true },
            ],
            visibility: 'admin',
          });
        } catch (error) {
          console.error('Failed to log Stripe subscription update to Discord:', error);
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const stripeCustomerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

      if (stripeCustomerId) {
        const { data: sub } = await db
          .from('flair_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();

        if (sub?.user_id) {
          await createSubscriptionNotification(db, sub.user_id, {
            title: 'Subscription payment failed',
            message: 'Your Flair Premium payment failed. Please update your billing details to keep premium features.',
            type: 'warning',
            actionUrl: '/billing',
            metadata: {
              event: 'subscription_payment_failed',
              invoice_id: invoice.id,
            },
          });
        }
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Error handling Flair Stripe webhook:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Webhook handling failed.',
    });
  }
}

router.post('/webhook', handleFlairStripeWebhook);

export default router;

