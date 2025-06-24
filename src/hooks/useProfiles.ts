import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const uploadProfile = async (profileData: {
    title: string;
    category: Profile['category'];
    type: Profile['type'];
    image_url: string;
    tags: string[];
    user_id: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;
      
      // Add to local state
      setProfiles(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Upload failed';
      return { data: null, error };
    }
  };

  const downloadProfile = async (profileId: string, userId?: string) => {
    try {
      const { error } = await supabase
        .from('downloads')
        .insert([{
          profile_id: profileId,
          user_id: userId || null,
        }]);

      if (error) throw error;
      
      // Update local download count
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

  const toggleFavorite = async (profileId: string, userId: string) => {
    try {
      // Check if already favorited
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('profile_id', profileId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('profile_id', profileId)
          .eq('user_id', userId);
        
        if (error) throw error;
        return false; // Not favorited anymore
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert([{ profile_id: profileId, user_id: userId }]);
        
        if (error) throw error;
        return true; // Now favorited
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return null;
    }
  };

const uploadImage = async (file: File, path: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { publicUrl } = supabase.storage
      .from('profile-images')
      .getPublicUrl(path).data;

    return { url: publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : 'Upload failed' };
  }
};

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    uploadProfile,
    downloadProfile,
    toggleFavorite,
    uploadImage,
  };
}