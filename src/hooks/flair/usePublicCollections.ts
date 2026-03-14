import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCollectionContentByIds } from '@/lib/collectionContent';

type PreviewContentType = 'profile' | 'banner' | 'emote' | 'wallpaper' | 'profile_pair';

interface CollectionPreviewItem {
  id: string;
  name: string;
  image_url: string;
  content_type: PreviewContentType;
  pfp_url?: string | null;
  banner_url?: string | null;
}

interface FlairCollectionRow {
  id: string;
  name: string;
  description: string | null;
  emote_ids: string[] | null;
  is_public: boolean;
  download_count: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface UserProfileRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

type ContentTypeCounts = Record<PreviewContentType, number>;

export interface PublicCollectionItem {
  id: string;
  name: string;
  description: string | null;
  emote_ids: string[];
  is_public: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  creator_username: string;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
  preview_items: CollectionPreviewItem[];
  content_type_counts: ContentTypeCounts;
  total_items: number;
}

export function usePublicCollections() {
  const [collections, setCollections] = useState<PublicCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('flair_emote_collections')
      .select('id, name, description, emote_ids, is_public, download_count, created_at, updated_at, user_id')
      .eq('is_public', true)
      .eq('is_active', true)
      .order('download_count', { ascending: false })
      .order('updated_at', { ascending: false });

    if (collectionsError) {
      console.error(collectionsError);
      setCollections([]);
      setLoading(false);
      return;
    }

    const collectionRows = (collectionsData || []) as FlairCollectionRow[];
    const userIds = [...new Set(collectionRows.map((item) => item.user_id))];
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    const profileLookup = new Map<string, UserProfileRow>();
    ((profileData || []) as UserProfileRow[]).forEach((profile) => profileLookup.set(profile.user_id, profile));

    const merged = await Promise.all(
      collectionRows.map(async (item) => {
        const creator = profileLookup.get(item.user_id);
        const allItemIds = Array.isArray(item.emote_ids) ? item.emote_ids : [];
        const resolvedItems = allItemIds.length > 0 ? await getCollectionContentByIds(allItemIds) : [];
        const previewItems = resolvedItems.slice(0, 5);
        const contentTypeCounts = resolvedItems.reduce(
          (acc, contentItem) => {
            acc[contentItem.content_type] += 1;
            return acc;
          },
          { emote: 0, wallpaper: 0, profile: 0, banner: 0, profile_pair: 0 } as ContentTypeCounts
        );
        return {
          ...item,
          emote_ids: item.emote_ids || [],
          download_count: item.download_count || 0,
          creator_username: creator?.username || 'unknown',
          creator_display_name: creator?.display_name || null,
          creator_avatar_url: creator?.avatar_url || null,
          preview_items: previewItems as CollectionPreviewItem[],
          content_type_counts: contentTypeCounts,
          total_items: resolvedItems.length,
        };
      })
    );

    setCollections(merged as PublicCollectionItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return { collections, loading, refetch: fetchCollections };
}

export async function getPublicCollectionById(collectionId: string) {
  const { data: collection, error } = await supabase
    .from('flair_emote_collections')
    .select('id, name, description, emote_ids, is_public, download_count, created_at, updated_at, user_id')
    .eq('id', collectionId)
    .eq('is_public', true)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !collection) return null;
  const collectionRow = collection as FlairCollectionRow;

  const [{ data: creator }, contentItems] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('user_id, username, display_name, avatar_url')
      .eq('user_id', collectionRow.user_id)
      .maybeSingle(),
    getCollectionContentByIds(collectionRow.emote_ids || []),
  ]);

  return {
    ...collectionRow,
    emote_ids: collectionRow.emote_ids || [],
    download_count: collectionRow.download_count || 0,
    creator_username: (creator as UserProfileRow | null)?.username || 'unknown',
    creator_display_name: (creator as UserProfileRow | null)?.display_name || null,
    creator_avatar_url: (creator as UserProfileRow | null)?.avatar_url || null,
    content_items: contentItems || [],
  };
}

export async function incrementCollectionDownload(collectionId: string) {
  const { error } = await supabase.rpc('increment_flair_collection_download', {
    p_collection_id: collectionId,
  });
  if (error) {
    console.error('Failed to increment collection download', error);
  }
}
