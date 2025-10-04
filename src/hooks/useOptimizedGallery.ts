import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface ProfilePair {
  id: string;
  user_id: string;
  title: string;
  category: string;
  tags: string[];
  pfp_url: string;
  banner_url: string;
  created_at: string;
  updated_at: string;
  type: "pair";
}

interface Profile {
  id: string;
  user_id: string;
  title: string;
  category: string;
  type: string;
  image_url: string;
  download_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  text_data: string;
}

type GalleryItem = ProfilePair | Profile;

// Cache for storing fetched data
const galleryCache = new Map<string, { data: GalleryItem[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useOptimizedGallery() {
  const [profiles, setProfiles] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'gallery_profiles';
    const cached = galleryCache.get(cacheKey);
    
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProfiles(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Promise.all to fetch both tables in parallel
      const [pairsResult, profilesResult] = await Promise.all([
        supabase
          .from("profile_pairs")
          .select("*")
          .order("updated_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .order("updated_at", { ascending: false })
      ]);

      if (pairsResult.error || profilesResult.error) {
        throw new Error("Failed to fetch profiles");
      }

      const allProfiles: GalleryItem[] = [];

      // Process profile_pairs data
      if (pairsResult.data) {
        const processedPairs: ProfilePair[] = pairsResult.data.map((item) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.title || "Untitled Profile Pair",
          category: item.category || "General",
          tags: Array.isArray(item.tags) ? item.tags : [],
          pfp_url: item.pfp_url || "",
          banner_url: item.banner_url || "",
          created_at: item.created_at,
          updated_at: item.updated_at,
          type: "pair" as const,
        }));
        allProfiles.push(...processedPairs);
      }

      // Process profiles data
      if (profilesResult.data) {
        const processedProfiles: Profile[] = profilesResult.data.map((item) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.title || "Untitled Profile",
          category: item.category || "General",
          type: item.type || "profile",
          image_url: item.image_url || "",
          download_count: item.download_count || 0,
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item.created_at,
          updated_at: item.updated_at,
          text_data: item.text_data || "",
        }));
        allProfiles.push(...processedProfiles);
      }

      // Sort all profiles by updated_at
      allProfiles.sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateB - dateA;
      });

      // Cache the results
      galleryCache.set(cacheKey, { data: allProfiles, timestamp: Date.now() });
      setProfiles(allProfiles);
    } catch (err) {
      setError("Failed to load profiles");
      console.error("Error fetching profiles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized computed values
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    profiles.forEach((p) => p.tags?.forEach((tag) => tagsSet.add(tag.toLowerCase().trim())));
    return Array.from(tagsSet)
      .filter((tag) => tag.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  const categories = useMemo(() => {
    const categoriesSet = new Set<string>();
    profiles.forEach((p) => categoriesSet.add(p.category));
    return Array.from(categoriesSet).sort();
  }, [profiles]);

  const types = useMemo(() => {
    const typesSet = new Set<string>();
    profiles.forEach((p) => {
      if (p.type === "pair") {
        typesSet.add("pair");
      } else {
        typesSet.add(p.type);
      }
    });
    return Array.from(typesSet).sort();
  }, [profiles]);

  // Initial load
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    allTags,
    categories,
    types,
    refresh: () => fetchProfiles(true),
    clearCache: () => galleryCache.clear()
  };
}
