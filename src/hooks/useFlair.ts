import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/authContext';
import type { Database } from '@/types/database';

type FlairProfile = Database['public']['Tables']['flair_profiles']['Row'];
type FlairEmote = Database['public']['Tables']['flair_emotes']['Row'];
type FlairEmoteSet = Database['public']['Tables']['flair_emote_sets']['Row'];
type FlairProfileTheme = Database['public']['Tables']['flair_profile_themes']['Row'];
type FlairSubscription = Database['public']['Tables']['flair_subscriptions']['Row'];

// Hook for Flair Profile
export function useFlairProfile(userId?: string) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FlairProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('flair_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('flair_profiles')
            .insert([{ user_id: targetUserId }])
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          throw fetchError;
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching flair profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const updateProfile = useCallback(
    async (updates: Partial<FlairProfile>) => {
      if (!targetUserId || !user) return;

      try {
        const { data, error: updateError } = await supabase
          .from('flair_profiles')
          .update(updates)
          .eq('user_id', targetUserId)
          .select()
          .single();

        if (updateError) throw updateError;
        setProfile(data);
        return data;
      } catch (err) {
        console.error('Error updating flair profile:', err);
        throw err;
      }
    },
    [targetUserId, user]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}

// Hook for Flair Emotes
export function useFlairEmotes(userId?: string) {
  const { user } = useAuth();
  const [emotes, setEmotes] = useState<FlairEmote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  const fetchEmotes = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('flair_emotes')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEmotes(data || []);
    } catch (err) {
      console.error('Error fetching flair emotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load emotes');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const uploadEmote = useCallback(
    async (emote: {
      name: string;
      image_url: string;
      emote_type: 'static' | 'animated';
      is_public?: boolean;
      tags?: string[];
    }) => {
      if (!targetUserId || !user) return;

      try {
        const { data, error: insertError } = await supabase
          .from('flair_emotes')
          .insert([
            {
              ...emote,
              user_id: targetUserId,
              is_public: emote.is_public ?? false,
              tags: emote.tags || [],
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        setEmotes((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        console.error('Error uploading emote:', err);
        throw err;
      }
    },
    [targetUserId, user]
  );

  const deleteEmote = useCallback(
    async (emoteId: string) => {
      if (!user) return;

      try {
        const { error: deleteError } = await supabase
          .from('flair_emotes')
          .delete()
          .eq('id', emoteId)
          .eq('user_id', targetUserId);

        if (deleteError) throw deleteError;
        setEmotes((prev) => prev.filter((e) => e.id !== emoteId));
      } catch (err) {
        console.error('Error deleting emote:', err);
        throw err;
      }
    },
    [user, targetUserId]
  );

  const updateEmote = useCallback(
    async (emoteId: string, updates: Partial<FlairEmote>) => {
      if (!user) return;

      try {
        const { data, error: updateError } = await supabase
          .from('flair_emotes')
          .update(updates)
          .eq('id', emoteId)
          .eq('user_id', targetUserId)
          .select()
          .single();

        if (updateError) throw updateError;
        setEmotes((prev) =>
          prev.map((e) => (e.id === emoteId ? data : e))
        );
        return data;
      } catch (err) {
        console.error('Error updating emote:', err);
        throw err;
      }
    },
    [user, targetUserId]
  );

  useEffect(() => {
    fetchEmotes();
  }, [fetchEmotes]);

  return {
    emotes,
    loading,
    error,
    uploadEmote,
    deleteEmote,
    updateEmote,
    refetch: fetchEmotes,
  };
}

// Hook for Public Flair Emotes (Gallery)
export function usePublicFlairEmotes() {
  const [emotes, setEmotes] = useState<FlairEmote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicEmotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('flair_emotes')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEmotes(data || []);
    } catch (err) {
      console.error('Error fetching public flair emotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load emotes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicEmotes();
  }, [fetchPublicEmotes]);

  return { emotes, loading, error, refetch: fetchPublicEmotes };
}

// Hook for Flair Emote Sets
export function useFlairEmoteSets(userId?: string) {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlairEmoteSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  const fetchSets = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('flair_emote_sets')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSets(data || []);
    } catch (err) {
      console.error('Error fetching flair emote sets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load emote sets');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const createSet = useCallback(
    async (set: {
      name: string;
      channel_name: string;
      channel_type: 'twitch' | 'youtube' | 'discord';
      emote_ids?: string[];
    }) => {
      if (!targetUserId || !user) return;

      try {
        const { data, error: insertError } = await supabase
          .from('flair_emote_sets')
          .insert([
            {
              ...set,
              user_id: targetUserId,
              emote_ids: set.emote_ids || [],
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        setSets((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        console.error('Error creating emote set:', err);
        throw err;
      }
    },
    [targetUserId, user]
  );

  const updateSet = useCallback(
    async (setId: string, updates: Partial<FlairEmoteSet>) => {
      if (!user) return;

      try {
        const { data, error: updateError } = await supabase
          .from('flair_emote_sets')
          .update(updates)
          .eq('id', setId)
          .eq('user_id', targetUserId)
          .select()
          .single();

        if (updateError) throw updateError;
        setSets((prev) => prev.map((s) => (s.id === setId ? data : s)));
        return data;
      } catch (err) {
        console.error('Error updating emote set:', err);
        throw err;
      }
    },
    [user, targetUserId]
  );

  const deleteSet = useCallback(
    async (setId: string) => {
      if (!user) return;

      try {
        const { error: deleteError } = await supabase
          .from('flair_emote_sets')
          .delete()
          .eq('id', setId)
          .eq('user_id', targetUserId);

        if (deleteError) throw deleteError;
        setSets((prev) => prev.filter((s) => s.id !== setId));
      } catch (err) {
        console.error('Error deleting emote set:', err);
        throw err;
      }
    },
    [user, targetUserId]
  );

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  return {
    sets,
    loading,
    error,
    createSet,
    updateSet,
    deleteSet,
    refetch: fetchSets,
  };
}

// Hook for Flair Profile Themes
export function useFlairThemes() {
  const [themes, setThemes] = useState<FlairProfileTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('flair_profile_themes')
        .select('*')
        .eq('is_active', true)
        .order('is_premium', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setThemes(data || []);
    } catch (err) {
      console.error('Error fetching flair themes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  return { themes, loading, error, refetch: fetchThemes };
}

// Hook for Flair Subscription
export function useFlairSubscription(userId?: string) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<FlairSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const targetUserId = userId || user?.id;

  const fetchSubscription = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('flair_subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Subscription doesn't exist, create free one
          const { data: newSub, error: createError } = await supabase
            .from('flair_subscriptions')
            .insert([
              {
                user_id: targetUserId,
                subscription_tier: 'free',
                status: 'active',
              },
            ])
            .select()
            .single();

          if (createError) throw createError;
          setSubscription(newSub);
          setIsPremium(false);
        } else {
          throw fetchError;
        }
      } else {
        setSubscription(data);
        setIsPremium(
          data.subscription_tier === 'premium' && data.status === 'active'
        );
      }
    } catch (err) {
      console.error('Error fetching flair subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const checkPremium = useCallback(async () => {
    if (!targetUserId) return false;

    try {
      const { data, error: checkError } = await supabase.rpc('is_premium_user', {
        p_user_id: targetUserId,
      });

      if (checkError) throw checkError;
      setIsPremium(data || false);
      return data || false;
    } catch (err) {
      console.error('Error checking premium status:', err);
      return false;
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (subscription) {
      checkPremium();
    }
  }, [subscription, checkPremium]);

  return {
    subscription,
    isPremium,
    loading,
    error,
    refetch: fetchSubscription,
    checkPremium,
  };
}

