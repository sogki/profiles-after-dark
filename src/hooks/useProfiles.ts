import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

export { useProfiles };

type Profile = Database['public']['Tables']['profiles']['Row'];
type EmojiCombo = Database['public']['Tables']['emoji_combos']['Row'];
type Favorite = Database['public']['Tables']['favorites']['Row'];

// Extended profile with favorites and downloads info
interface ProfileWithExtras extends Profile {
  favorites_count: number;
  is_favorited: boolean;
  downloads_count: number;
}

function useProfiles(
  typeFilter?: string,
  userFilter?: string,
  currentUserId?: string
) {
  // Profiles state
  const [profiles, setProfiles] = useState<ProfileWithExtras[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // Emoji combos state
  const [emojiCombos, setEmojiCombos] = useState<EmojiCombo[]>([]);
  const [emojiLoading, setEmojiLoading] = useState(true);
  const [emojiError, setEmojiError] = useState<string | null>(null);

  // Utility: deduplicate profiles by id
  const deduplicateProfiles = (items: ProfileWithExtras[]) => {
    const map = new Map<string, ProfileWithExtras>();
    items.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  };

  // Fetch profiles + favorites count + user favorites + downloads count
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

      const { data: profilesData, error: profilesError } = await query;
      if (profilesError) throw profilesError;
      if (!profilesData) {
        setProfiles([]);
        setProfilesError(null);
        setProfilesLoading(false);
        return;
      }

      // Get all profile IDs to fetch related data
      const profileIds = profilesData.map(p => p.id);

      // Fetch favorites count per profile
      const { data: favCounts, error: favCountError } = await supabase
        .from('favorites')
        .select('profile_id', { count: 'exact' })
        .in('profile_id', profileIds);

      if (favCountError) throw favCountError;

      // Count favorites grouped by profile_id
      const favoritesCountMap = new Map<string, number>();
      favCounts?.forEach(f => {
        favoritesCountMap.set(f.profile_id, (favoritesCountMap.get(f.profile_id) ?? 0) + 1);
      });

      // Fetch current user's favorites for these profiles
      let userFavorites: Favorite[] = [];
      if (currentUserId) {
        const { data, error } = await supabase
          .from('favorites')
          .select('profile_id')
          .eq('user_id', currentUserId)
          .in('profile_id', profileIds);
        if (error) throw error;
        userFavorites = data || [];
      }

      // Fetch downloads count per profile
      const { data: downloadsData, error: downloadsError } = await supabase
        .from('downloads')
        .select('profile_id')
        .in('profile_id', profileIds);

      if (downloadsError) throw downloadsError;

      // Count downloads grouped by profile_id
      const downloadsCountMap = new Map<string, number>();
      downloadsData?.forEach(d => {
        downloadsCountMap.set(d.profile_id, (downloadsCountMap.get(d.profile_id) ?? 0) + 1);
      });

      // Compose enriched profiles
      const enrichedProfiles: ProfileWithExtras[] = profilesData.map(p => {
        return {
          ...p,
          favorites_count: favoritesCountMap.get(p.id) ?? 0,
          is_favorited: userFavorites.some(f => f.profile_id === p.id),
          downloads_count: downloadsCountMap.get(p.id) ?? 0,
        };
      });

      setProfiles(deduplicateProfiles(enrichedProfiles));
      setProfilesError(null);
    } catch (err) {
      setProfilesError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProfilesLoading(false);
    }
  }, [typeFilter, currentUserId]);

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
            // Add initial counts with zero and false favorite
            const newProfile: ProfileWithExtras = {
              ...profile,
              favorites_count: 0,
              is_favorited: false,
              downloads_count: 0,
            };
            return [newProfile, ...prev];
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
            ? { ...profile, downloads_count: (profile.downloads_count || 0) + 1 }
            : profile
        )
      );
    } catch (err) {
      console.error('Error recording download:', err);
    }
  }, []);

  // Toggle favorite (add/remove)
  const toggleFavorite = useCallback(
    async (profileId: string, userId: string) => {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from('favorites')
          .select('id')
          .eq('profile_id', profileId)
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
          // Unfavorite
          const { error: deleteError } = await supabase
            .from('favorites')
            .delete()
            .eq('id', existing.id);
          if (deleteError) throw deleteError;

          setProfiles(prev =>
            prev.map(profile =>
              profile.id === profileId
                ? { ...profile, favorites_count: Math.max((profile.favorites_count || 1) - 1, 0), is_favorited: false }
                : profile
            )
          );

          return false; // now unfavorited
        } else {
          // Favorite
          const { error: insertError } = await supabase
            .from('favorites')
            .insert([{ profile_id: profileId, user_id: userId }]);
          if (insertError) throw insertError;

          setProfiles(prev =>
            prev.map(profile =>
              profile.id === profileId
                ? { ...profile, favorites_count: (profile.favorites_count || 0) + 1, is_favorited: true }
                : profile
            )
          );

          return true; // now favorited
        }
      } catch (err) {
        console.error('Error toggling favorite:', err);
        return null;
      }
    },
    []
  );

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
