import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/authContext';
import { supabase } from '@/lib/supabase';

export interface EmoteCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  emote_ids: string[];
  is_active: boolean;
  is_public?: boolean;
  download_count?: number;
  created_at: string;
  updated_at: string;
}

interface UpsertCollectionInput {
  name: string;
  description?: string;
  emote_ids: string[];
  is_active?: boolean;
  is_public?: boolean;
}

export function useEmoteCollections(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const [collections, setCollections] = useState<EmoteCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await (supabase as any)
        .from('flair_emote_collections')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCollections((data || []) as EmoteCollection[]);
    } catch (err) {
      console.error('Error fetching emote collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load emote collections');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const createCollection = useCallback(
    async (input: UpsertCollectionInput) => {
      if (!targetUserId || !user) return null;

      const payload = {
        user_id: targetUserId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        emote_ids: input.emote_ids || [],
        is_active: input.is_active ?? true,
        is_public: input.is_public ?? true,
      };

      const { data, error: createError } = await (supabase as any)
        .from('flair_emote_collections')
        .insert([payload])
        .select()
        .single();

      if (createError) throw createError;
      setCollections((prev) => [data as EmoteCollection, ...prev]);
      return data as EmoteCollection;
    },
    [targetUserId, user]
  );

  const updateCollection = useCallback(
    async (collectionId: string, input: Partial<UpsertCollectionInput>) => {
      if (!targetUserId || !user) return null;

      const payload: Record<string, unknown> = {};
      if (typeof input.name === 'string') payload.name = input.name.trim();
      if (typeof input.description !== 'undefined') payload.description = input.description?.trim() || null;
      if (Array.isArray(input.emote_ids)) payload.emote_ids = input.emote_ids;
      if (typeof input.is_active === 'boolean') payload.is_active = input.is_active;
      if (typeof input.is_public === 'boolean') payload.is_public = input.is_public;

      const { data, error: updateError } = await (supabase as any)
        .from('flair_emote_collections')
        .update(payload)
        .eq('id', collectionId)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (updateError) throw updateError;
      setCollections((prev) => prev.map((item) => (item.id === collectionId ? (data as EmoteCollection) : item)));
      return data as EmoteCollection;
    },
    [targetUserId, user]
  );

  const deleteCollection = useCallback(
    async (collectionId: string) => {
      if (!targetUserId || !user) return;

      const { error: deleteError } = await (supabase as any)
        .from('flair_emote_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', targetUserId);

      if (deleteError) throw deleteError;
      setCollections((prev) => prev.filter((item) => item.id !== collectionId));
    },
    [targetUserId, user]
  );

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
  };
}
