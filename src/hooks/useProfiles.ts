import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
export { useData as useProfiles };

type Profile = Database['public']['Tables']['profiles']['Row'];
type EmojiCombo = Database['public']['Tables']['emoji_combos']['Row'];

export function useData(typeFilter?: string, userFilter?: string) {
  // Profiles state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // Emoji combos state
  const [emojiCombos, setEmojiCombos] = useState<EmojiCombo[]>([]);
  const [emojiLoading, setEmojiLoading] = useState(true);
  const [emojiError, setEmojiError] = useState<string | null>(null);

  // Fetch profiles (optional filter by type)
  const fetchProfiles = async () => {
    try {
      setProfilesLoading(true);

      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProfiles(data || []);
      setProfilesError(null);
    } catch (err) {
      setProfilesError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProfilesLoading(false);
    }
  };

  // Upload profile
  const uploadProfile = async (profileData: {
    title: string;
    category: Profile['category'];
    type: Profile['type'];
    image_url?: string | null;
    tags: string[];
    user_id: string;
    text_data?: string | null;
  }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;

      if (!typeFilter || profileData.type === typeFilter) {
        setProfiles(prev => [data, ...prev]);
      }

      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Upload failed';
      return { data: null, error };
    }
  };

  // Fetch emoji combos (optional filter by user_id)
  const fetchEmojiCombos = async () => {
    try {
      setEmojiLoading(true);

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
  };

  // Upload emoji combo
  const uploadEmojiCombo = async (comboData: {
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
        setEmojiCombos(prev => [data, ...prev]);
      }

      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Upload failed';
      return { data: null, error };
    }
  };

  // Download profile (increment count)
  const downloadProfile = async (profileId: string, userId?: string) => {
    try {
      const { error } = await supabase
        .from('downloads')
        .insert([{
          profile_id: profileId,
          user_id: userId || null,
        }]);

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
  };

  // Toggle favorite (add/remove)
  const toggleFavorite = async (profileId: string, userId: string) => {
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
  };

  // FIXED uploadImage: handle upload + getPublicUrl correctly
  const uploadImage = async (file: File, path: string) => {
    try {
      // Upload file
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      // Get public URL (note getPublicUrl returns { data, error })
      const { data: urlData, error: urlError } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path);

      if (urlError) throw urlError;

      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      return { url: null, error: err instanceof Error ? err.message : 'Upload failed' };
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchProfiles();
  }, [typeFilter]);

  useEffect(() => {
    fetchEmojiCombos();
  }, [userFilter]);

  return {
    // profiles
    profiles,
    profilesLoading,
    profilesError,
    fetchProfiles,
    uploadProfile,
    downloadProfile,
    toggleFavorite,
    uploadImage,

    // emoji combos
    emojiCombos,
    emojiLoading,
    emojiError,
    fetchEmojiCombos,
    uploadEmojiCombo,
  };
}
