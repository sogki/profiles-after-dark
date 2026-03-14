import { supabase } from '@/lib/supabase';

export interface CollectionContentItem {
  id: string;
  name: string;
  image_url: string;
  content_type: 'profile' | 'banner' | 'emote' | 'wallpaper' | 'profile_pair';
  pfp_url?: string | null;
  banner_url?: string | null;
}

interface UploadLikeRow {
  id: string;
  title: string | null;
  image_url: string | null;
  type: string | null;
}

interface ProfilePairRow {
  id: string;
  title: string | null;
  pfp_url: string | null;
  banner_url: string | null;
}

interface BasicContentRow {
  id: string;
  title: string | null;
  image_url: string | null;
}

export async function getUserCollectionContentOptions(userId: string): Promise<CollectionContentItem[]> {
  const [profiles, profilePairs, emotes, wallpapers] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, title, image_url, type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profile_pairs')
      .select('id, title, pfp_url, banner_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('emotes')
      .select('id, title, image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('wallpapers')
      .select('id, title, image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  const profileItems: CollectionContentItem[] = ((profiles.data || []) as UploadLikeRow[])
    .filter((item) => Boolean(item.image_url))
    .map((item) => ({
    id: item.id,
    name: item.title || (item.type === 'banner' ? 'Banner' : 'Profile'),
    image_url: item.image_url as string,
    content_type: item.type === 'banner' ? 'banner' : 'profile',
  }));

  const pairItems: CollectionContentItem[] = ((profilePairs.data || []) as ProfilePairRow[]).map((item) => ({
    id: item.id,
    name: item.title || 'Profile Pair',
    image_url: item.banner_url || item.pfp_url || '',
    content_type: 'profile_pair',
    pfp_url: item.pfp_url,
    banner_url: item.banner_url,
  })).filter((item: CollectionContentItem) => Boolean(item.image_url));

  const emoteItems: CollectionContentItem[] = ((emotes.data || []) as BasicContentRow[])
    .filter((item) => Boolean(item.image_url))
    .map((item) => ({
    id: item.id,
    name: item.title || 'Emote',
    image_url: item.image_url as string,
    content_type: 'emote',
  }));

  const wallpaperItems: CollectionContentItem[] = ((wallpapers.data || []) as BasicContentRow[])
    .filter((item) => Boolean(item.image_url))
    .map((item) => ({
    id: item.id,
    name: item.title || 'Wallpaper',
    image_url: item.image_url as string,
    content_type: 'wallpaper',
  }));

  return [...pairItems, ...profileItems, ...emoteItems, ...wallpaperItems];
}

export async function getCollectionContentByIds(contentIds: string[]): Promise<CollectionContentItem[]> {
  if (!contentIds.length) return [];

  const [profiles, profilePairs, emotes, wallpapers] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, title, image_url, type')
      .in('id', contentIds),
    supabase
      .from('profile_pairs')
      .select('id, title, pfp_url, banner_url')
      .in('id', contentIds),
    supabase
      .from('emotes')
      .select('id, title, image_url')
      .in('id', contentIds),
    supabase
      .from('wallpapers')
      .select('id, title, image_url')
      .in('id', contentIds),
  ]);
  const allItems = new Map<string, CollectionContentItem>();

  ((profiles.data || []) as UploadLikeRow[]).forEach((item) => {
    if (!item.image_url) return;
    allItems.set(item.id, {
      id: item.id,
      name: item.title || (item.type === 'banner' ? 'Banner' : 'Profile'),
      image_url: item.image_url,
      content_type: item.type === 'banner' ? 'banner' : 'profile',
    });
  });

  ((profilePairs.data || []) as ProfilePairRow[]).forEach((item) => {
    const imageUrl = item.banner_url || item.pfp_url || '';
    if (!imageUrl) return;
    allItems.set(item.id, {
      id: item.id,
      name: item.title || 'Profile Pair',
      image_url: imageUrl,
      content_type: 'profile_pair',
      pfp_url: item.pfp_url,
      banner_url: item.banner_url,
    });
  });

  ((emotes.data || []) as BasicContentRow[]).forEach((item) => {
    if (!item.image_url) return;
    allItems.set(item.id, {
      id: item.id,
      name: item.title || 'Emote',
      image_url: item.image_url,
      content_type: 'emote',
    });
  });

  ((wallpapers.data || []) as BasicContentRow[]).forEach((item) => {
    if (!item.image_url) return;
    allItems.set(item.id, {
      id: item.id,
      name: item.title || 'Wallpaper',
      image_url: item.image_url,
      content_type: 'wallpaper',
    });
  });

  return contentIds.map((id) => allItems.get(id)).filter(Boolean) as CollectionContentItem[];
}
