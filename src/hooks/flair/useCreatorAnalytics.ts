import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/authContext';
import { supabase } from '@/lib/supabase';

export interface CreatorAnalyticsSummary {
  total_uploads: number;
  profile_uploads: number;
  emote_uploads: number;
  wallpaper_uploads: number;
  pair_uploads: number;
  total_downloads: number;
  follower_count: number;
  public_emote_uses: number;
}

const EMPTY_SUMMARY: CreatorAnalyticsSummary = {
  total_uploads: 0,
  profile_uploads: 0,
  emote_uploads: 0,
  wallpaper_uploads: 0,
  pair_uploads: 0,
  total_downloads: 0,
  follower_count: 0,
  public_emote_uses: 0,
};

function normalizeSummary(payload: any): CreatorAnalyticsSummary {
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row) return EMPTY_SUMMARY;
  return {
    total_uploads: Number(row.total_uploads ?? 0),
    profile_uploads: Number(row.profile_uploads ?? 0),
    emote_uploads: Number(row.emote_uploads ?? 0),
    wallpaper_uploads: Number(row.wallpaper_uploads ?? 0),
    pair_uploads: Number(row.pair_uploads ?? 0),
    total_downloads: Number(row.total_downloads ?? 0),
    follower_count: Number(row.follower_count ?? 0),
    public_emote_uses: Number(row.public_emote_uses ?? 0),
  };
}

async function fetchSummaryFromTables(targetUserId: string): Promise<CreatorAnalyticsSummary> {
  const [profiles, emotes, wallpapers, pairs, followers] = await Promise.all([
    (supabase as any).from('profiles').select('id, download_count', { count: 'exact' }).eq('user_id', targetUserId),
    (supabase as any).from('emotes').select('id, download_count', { count: 'exact' }).eq('user_id', targetUserId),
    (supabase as any).from('wallpapers').select('id, download_count', { count: 'exact' }).eq('user_id', targetUserId),
    (supabase as any).from('profile_pairs').select('id, download_count', { count: 'exact' }).eq('user_id', targetUserId),
    (supabase as any).from('follows').select('id', { count: 'exact', head: true }).eq('following_id', targetUserId),
  ]);

  const getDownloads = (rows: any[] | null | undefined) =>
    (rows || []).reduce((sum: number, row: any) => sum + Number(row.download_count || 0), 0);

  const profileUploads = Number(profiles.count || 0);
  const emoteUploads = Number(emotes.count || 0);
  const wallpaperUploads = Number(wallpapers.count || 0);
  const pairUploads = Number(pairs.count || 0);
  const totalDownloads =
    getDownloads(profiles.data) + getDownloads(emotes.data) + getDownloads(wallpapers.data) + getDownloads(pairs.data);

  return {
    total_uploads: profileUploads + emoteUploads + wallpaperUploads + pairUploads,
    profile_uploads: profileUploads,
    emote_uploads: emoteUploads,
    wallpaper_uploads: wallpaperUploads,
    pair_uploads: pairUploads,
    total_downloads: totalDownloads,
    follower_count: Number(followers.count || 0),
    public_emote_uses: getDownloads(emotes.data),
  };
}

export function useCreatorAnalytics(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const [summary, setSummary] = useState<CreatorAnalyticsSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_creator_analytics_summary', {
        p_user_id: targetUserId,
      });
      if (rpcError) throw rpcError;
      const normalized = normalizeSummary(data);
      if (
        normalized.total_uploads === 0 &&
        normalized.total_downloads === 0 &&
        normalized.follower_count === 0
      ) {
        const fallback = await fetchSummaryFromTables(targetUserId);
        setSummary(fallback);
      } else {
        setSummary(normalizeSummary(data));
      }
    } catch (err) {
      console.error('Error fetching creator analytics:', err);
      try {
        const fallback = await fetchSummaryFromTables(targetUserId);
        setSummary(fallback);
        setError(null);
      } catch (fallbackError) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setSummary(EMPTY_SUMMARY);
      }
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
