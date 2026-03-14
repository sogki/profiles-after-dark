import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/authContext';
import { supabase } from '@/lib/supabase';

export function useProfileSpotlight(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const [spotlightEnabled, setSpotlightEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpotlight = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('spotlight_enabled')
        .eq('user_id', targetUserId)
        .single();

      if (fetchError) throw fetchError;
      setSpotlightEnabled(Boolean((data as any)?.spotlight_enabled));
    } catch (err) {
      console.error('Error fetching spotlight status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load spotlight status');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const updateSpotlight = useCallback(
    async (enabled: boolean) => {
      if (!user || !targetUserId) return false;
      setError(null);

      const { error: rpcError } = await supabase.rpc('set_profile_spotlight_status', {
        p_enabled: enabled,
      });

      if (rpcError) {
        setError(rpcError.message);
        throw rpcError;
      }

      setSpotlightEnabled(enabled);
      return true;
    },
    [targetUserId, user]
  );

  useEffect(() => {
    fetchSpotlight();
  }, [fetchSpotlight]);

  return {
    spotlightEnabled,
    loading,
    error,
    refetch: fetchSpotlight,
    updateSpotlight,
  };
}
