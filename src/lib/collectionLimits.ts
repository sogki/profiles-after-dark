import { supabase } from '@/lib/supabase';

export interface CollectionQuota {
  isPremium: boolean;
  quota: number;
  used: number;
  remaining: number;
}

const FREE_COLLECTION_LIMIT = 3;

export async function getCollectionQuota(userId: string): Promise<CollectionQuota> {
  const [{ data: subscription }, { count, error: countError }] = await Promise.all([
    supabase
      .from('flair_subscriptions')
      .select('subscription_tier, status')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('flair_emote_collections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (countError) {
    throw countError;
  }

  const isPremium =
    subscription?.subscription_tier === 'premium' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing');
  const quota = isPremium ? Number.MAX_SAFE_INTEGER : FREE_COLLECTION_LIMIT;
  const used = count || 0;
  const remaining = Math.max(0, quota - used);

  return {
    isPremium,
    quota: isPremium ? FREE_COLLECTION_LIMIT : FREE_COLLECTION_LIMIT,
    used,
    remaining: isPremium ? Number.MAX_SAFE_INTEGER : remaining,
  };
}

export async function assertCanCreateCollection(userId: string) {
  const quota = await getCollectionQuota(userId);
  if (!quota.isPremium && quota.used >= FREE_COLLECTION_LIMIT) {
    throw new Error('Free users can create up to 3 collections. Upgrade to Premium for unlimited collections.');
  }
  return quota;
}
