import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FlairProfileRow {
  user_id: string;
  custom_display_name: string | null;
  display_name_animation: string | null;
  display_name_gradient: string | null;
}

interface FlairSubscriptionRow {
  user_id: string;
  status: string | null;
  subscription_tier: string | null;
}

export interface DiscoveryFlairName {
  userId: string;
  customDisplayName: string | null;
  animation: string | null;
  gradient: string | null;
  isPremium: boolean;
}

export function useDiscoveryFlairNames(userIds: string[]) {
  const [nameMap, setNameMap] = useState<Record<string, DiscoveryFlairName>>({});

  const normalizedUserIds = useMemo(
    () => [...new Set(userIds.filter(Boolean))],
    [userIds]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!normalizedUserIds.length) {
        if (!cancelled) setNameMap({});
        return;
      }

      const [flairProfilesResult, subscriptionsResult] = await Promise.all([
        supabase
          .from('flair_profiles')
          .select('user_id, custom_display_name, display_name_animation, display_name_gradient')
          .in('user_id', normalizedUserIds),
        supabase
          .from('flair_subscriptions')
          .select('user_id, status, subscription_tier')
          .in('user_id', normalizedUserIds),
      ]);

      if (cancelled) return;

      const flairProfiles = (flairProfilesResult.data || []) as FlairProfileRow[];
      const subscriptions = (subscriptionsResult.data || []) as FlairSubscriptionRow[];

      const premiumUsers = new Set(
        subscriptions
          .filter(
            (row) =>
              row.subscription_tier === 'premium' &&
              (row.status === 'active' || row.status === 'trialing')
          )
          .map((row) => row.user_id)
      );

      const map: Record<string, DiscoveryFlairName> = {};
      flairProfiles.forEach((row) => {
        map[row.user_id] = {
          userId: row.user_id,
          customDisplayName: row.custom_display_name,
          animation: row.display_name_animation,
          gradient: row.display_name_gradient,
          isPremium: premiumUsers.has(row.user_id),
        };
      });

      // Ensure subscribed users without flair_profile row still get map entries.
      premiumUsers.forEach((userId) => {
        if (!map[userId]) {
          map[userId] = {
            userId,
            customDisplayName: null,
            animation: null,
            gradient: null,
            isPremium: true,
          };
        }
      });

      setNameMap(map);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [normalizedUserIds]);

  return nameMap;
}
