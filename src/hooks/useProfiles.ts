import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

export { useProfiles };

type Profile = Database['public']['Tables']['profiles']['Row'];
type EmojiCombo = Database['public']['Tables']['emoji_combos']['Row'];

function useProfiles(typeFilter?: string, userFilter?: string) {
  // Profiles state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // Emoji combos state
  const [emojiCombos, setEmojiCombos] = useState<EmojiCombo[]>([]);
  const [emojiLoading, setEmojiLoading] = useState(true);
  const [emojiError, setEmojiError] = useState<string | null>(null);

  // Utility: deduplicate profiles by id
  const deduplicateProfiles = (items: Profile[]) => {
    const map = new Map<string, Profile>();
    items.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  };

  // Fetch profiles (memoized)
  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProfiles(deduplicateProfiles(data || []));
      setProfilesError(null);
    } catch (err) {
      setProfilesError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProfilesLoading(false);
    }
  }, [typeFilter]);

  // Upload profile + moderation log insertion
  const uploadProfile = useCallback(
    async (profileData: {
      title: string;
      category: Profile['category'];
      type: Profile['type'];
      image_url?: string | null;
      tags: string[];
      user_id: string;
      text_data?: string | null;
    }) => {
      try {
        // Insert profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();

        if (profileError) throw profileError;

        // Insert moderation log entry
        const { error: modError } = await supabase.from('moderation_logs').insert([
          {
            moderator_id: profileData.user_id,
            action: `upload ${profileData.type}`,
            target_user_id: profileData.user_id,
            target_profile_id: profile.id,
            description: `Uploaded ${profileData.type} titled "${profileData.title}"`,
          },
        ]);
        if (modError) throw modError;

        // Add new profile to state if it matches filter
        if (!typeFilter || profileData.type === typeFilter) {
          setProfiles(prev => {
            // Avoid duplicate insertion
            if (prev.some(p => p.id === profile.id)) return prev;
            return [profile, ...prev];
          });
        }

        return { data: profile, error: null };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Upload failed';
        return { data: null, error };
      }
    },
    [typeFilter]
  );

  // Fetch emoji combos (memoized)
  const fetchEmojiCombos = useCallback(async () => {
    setEmojiLoading(true);
    try {
      let query = supabase
        .from('emoji_combos')
        .select('*')
        .order('created_at', { ascending: false });

      if (userFilter) {
        query = query.eq('user_id', userFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setEmojiCombos(data || []);
      setEmojiError(null);
    } catch (err) {
      setEmojiError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setEmojiLoading(false);
    }
  }, [userFilter]);

  // Upload emoji combo
  const uploadEmojiCombo = useCallback(
    async (comboData: {
      name: string;
      combo_text: string;
      description?: string | null;
      tags: string[];
      user_id: string;
    }) => {
      try {
        const { data, error } = await supabase
          .from('emoji_combos')
          .insert([comboData])
          .select()
          .single();

        if (error) throw error;

        if (!userFilter || comboData.user_id === userFilter) {
          setEmojiCombos(prev => {
            if (prev.some(c => c.id === data.id)) return prev;
            return [data, ...prev];
          });
        }

        return { data, error: null };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Upload failed';
        return { data: null, error };
      }
    },
    [userFilter]
  );

  // Download profile (increment count)
  const downloadProfile = useCallback(async (profileId: string, userId?: string) => {
    try {
      const { error } = await supabase.from('downloads').insert([
        {
          profile_id: profileId,
          user_id: userId || null,
        },
      ]);
      if (error) throw error;

      setProfiles(prev =>
        prev.map(profile =>
          profile.id === profileId
            ? { ...profile, download_count: (profile.download_count || 0) + 1 }
            : profile
        )
      );
    } catch (err) {
      console.error('Error recording download:', err);
    }
  }, []);

  // Toggle favorite (add/remove)
  const toggleFavorite = useCallback(async (profileId: string, userId: string) => {
    try {
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('profile_id', profileId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('profile_id', profileId)
          .eq('user_id', userId);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ profile_id: profileId, user_id: userId }]);
        if (error) throw error;
        return true;
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return null;
    }
  }, []);

  // Upload image helper
  const uploadImage = useCallback(async (file: File, path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData, error: urlError } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path);
      if (urlError) throw urlError;

      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      return { url: null, error: err instanceof Error ? err.message : 'Upload failed' };
    }
  }, []);

  // Effects: fetch on filter changes
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    fetchEmojiCombos();
  }, [fetchEmojiCombos]);

  return {
    profiles,
    profilesLoading,
    profilesError,
    fetchProfiles,
    uploadProfile,
    downloadProfile,
    toggleFavorite,
    uploadImage,

    emojiCombos,
    emojiLoading,
    emojiError,
    fetchEmojiCombos,
    uploadEmojiCombo,
  };
}

