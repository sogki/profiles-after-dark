"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dialog, Transition } from "@headlessui/react";
import { Hash, ImageIcon, Sticker, Layout, Download, Heart, User, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/authContext";

interface UserProfile {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface TaggedItem {
  id: string;
  title: string;
  image_url?: string;
  pfp_url?: string;
  banner_url?: string;
  type: "profile" | "emote" | "wallpaper" | "pair";
  download_count: number;
  created_at: string;
  user_id: string;
  user_profiles?: UserProfile;
  tags?: string[];
}

export default function TagBrowse() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = decodeURIComponent(tag || "");
  const { user } = useAuth();
  
  const [items, setItems] = useState<TaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "title">("newest");
  const [previewItem, setPreviewItem] = useState<TaggedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load favorites from database
  useEffect(() => {
    if (user?.id) {
      async function loadFavorites() {
        try {
          const { data, error } = await supabase
            .from("favorites")
            .select("profile_id")
            .eq("user_id", user.id);

          if (!error && data) {
            setFavorites(new Set(data.map(f => f.profile_id)));
          }
        } catch (err) {
          console.error("Error loading favorites:", err);
        }
      }
      loadFavorites();
    }
  }, [user]);

  // Fetch all content with this tag
  useEffect(() => {
    if (!decodedTag) return;

    async function fetchTaggedContent() {
      setLoading(true);
      setError(null);
      
      try {
        const allItems: TaggedItem[] = [];

        // Fetch profiles with tags - filter in JavaScript
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, title, image_url, download_count, created_at, user_id, type, tags")
          .order("created_at", { ascending: false });

        if (!profilesError && profiles) {
          // Filter profiles by tag
          const filteredProfiles = profiles.filter(profile => {
            if (!profile.tags || !Array.isArray(profile.tags)) return false;
            return profile.tags.some(tag => tag.toLowerCase() === decodedTag.toLowerCase());
          });

          // Fetch user profiles for filtered profiles
          const userIds = [...new Set(filteredProfiles.map(p => p.user_id))];
          const { data: userProfiles } = await supabase
            .from("user_profiles")
            .select("user_id, username, display_name, avatar_url")
            .in("user_id", userIds);

          const userMap = new Map(userProfiles?.map(up => [up.user_id, up]) || []);

          filteredProfiles.forEach(profile => {
            allItems.push({
              id: profile.id,
              title: profile.title,
              image_url: profile.image_url,
              type: profile.type as "profile",
              download_count: profile.download_count || 0,
              created_at: profile.created_at,
              user_id: profile.user_id,
              user_profiles: userMap.get(profile.user_id),
              tags: Array.isArray(profile.tags) ? profile.tags : [],
            });
          });
        }

        // Fetch profile pairs with tags - filter in JavaScript
        const { data: pairs, error: pairsError } = await supabase
          .from("profile_pairs")
          .select("id, title, pfp_url, banner_url, download_count, created_at, user_id, tags")
          .order("created_at", { ascending: false });

        if (!pairsError && pairs) {
          // Filter pairs by tag
          const filteredPairs = pairs.filter(pair => {
            if (!pair.tags || !Array.isArray(pair.tags)) return false;
            return pair.tags.some(tag => tag.toLowerCase() === decodedTag.toLowerCase());
          });

          // Fetch user profiles for filtered pairs
          const userIds = [...new Set(filteredPairs.map(p => p.user_id))];
          const { data: userProfiles } = await supabase
            .from("user_profiles")
            .select("user_id, username, display_name, avatar_url")
            .in("user_id", userIds);

          const userMap = new Map(userProfiles?.map(up => [up.user_id, up]) || []);

          filteredPairs.forEach(pair => {
            allItems.push({
              id: pair.id,
              title: pair.title,
              pfp_url: pair.pfp_url,
              banner_url: pair.banner_url,
              type: "pair",
              download_count: pair.download_count || 0,
              created_at: pair.created_at,
              user_id: pair.user_id,
              user_profiles: userMap.get(pair.user_id),
              tags: Array.isArray(pair.tags) ? pair.tags : [],
            });
          });
        }

        // Fetch emotes with tags - filter in JavaScript
        const { data: emotes, error: emotesError } = await supabase
          .from("emotes")
          .select("id, title, image_url, download_count, created_at, user_id, tags")
          .order("created_at", { ascending: false });

        if (!emotesError && emotes) {
          // Filter emotes by tag
          const filteredEmotes = emotes.filter(emote => {
            if (!emote.tags || !Array.isArray(emote.tags)) return false;
            return emote.tags.some(tag => tag.toLowerCase() === decodedTag.toLowerCase());
          });

          // Fetch user profiles for filtered emotes
          const userIds = [...new Set(filteredEmotes.map(e => e.user_id))];
          const { data: userProfiles } = await supabase
            .from("user_profiles")
            .select("user_id, username, display_name, avatar_url")
            .in("user_id", userIds);

          const userMap = new Map(userProfiles?.map(up => [up.user_id, up]) || []);

          filteredEmotes.forEach(emote => {
            allItems.push({
              id: emote.id,
              title: emote.title,
              image_url: emote.image_url,
              type: "emote",
              download_count: emote.download_count || 0,
              created_at: emote.created_at,
              user_id: emote.user_id,
              user_profiles: userMap.get(emote.user_id),
              tags: Array.isArray(emote.tags) ? emote.tags : [],
            });
          });
        }

        // Fetch wallpapers with tags - filter in JavaScript
        const { data: wallpapers, error: wallpapersError } = await supabase
          .from("wallpapers")
          .select("id, title, image_url, download_count, created_at, user_id, tags")
          .order("created_at", { ascending: false });

        if (!wallpapersError && wallpapers) {
          // Filter wallpapers by tag
          const filteredWallpapers = wallpapers.filter(wallpaper => {
            if (!wallpaper.tags || !Array.isArray(wallpaper.tags)) return false;
            return wallpaper.tags.some(tag => tag.toLowerCase() === decodedTag.toLowerCase());
          });

          // Fetch user profiles for filtered wallpapers
          const userIds = [...new Set(filteredWallpapers.map(w => w.user_id))];
          const { data: userProfiles } = await supabase
            .from("user_profiles")
            .select("user_id, username, display_name, avatar_url")
            .in("user_id", userIds);

          const userMap = new Map(userProfiles?.map(up => [up.user_id, up]) || []);

          filteredWallpapers.forEach(wallpaper => {
            allItems.push({
              id: wallpaper.id,
              title: wallpaper.title,
              image_url: wallpaper.image_url,
              type: "wallpaper",
              download_count: wallpaper.download_count || 0,
              created_at: wallpaper.created_at,
              user_id: wallpaper.user_id,
              user_profiles: userMap.get(wallpaper.user_id),
              tags: Array.isArray(wallpaper.tags) ? wallpaper.tags : [],
            });
          });
        }

        setItems(allItems);
      } catch (err) {
        console.error("Error fetching tagged content:", err);
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    }

    fetchTaggedContent();
  }, [decodedTag]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sortBy) {
      case "popular":
        return sorted.sort((a, b) => b.download_count - a.download_count);
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "newest":
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [items, sortBy]);

  // Download image helper
  const downloadImage = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Failed to download image.");
    }
  }, []);

  // Handle download
  const handleDownload = useCallback(async (item: TaggedItem) => {
    if (item.type === "pair") {
      if (item.pfp_url) {
        const ext = item.pfp_url.split(".").pop()?.split(/[#?]/)[0] || "png";
        const sanitizedTitle = item.title.replace(/\s+/g, "_").toLowerCase();
        const pfpFilename = `pfp_${sanitizedTitle}.${ext}`;
        await downloadImage(item.pfp_url, pfpFilename);
      }
      if (item.banner_url) {
        const ext = item.banner_url.split(".").pop()?.split(/[#?]/)[0] || "png";
        const sanitizedTitle = item.title.replace(/\s+/g, "_").toLowerCase();
        const bannerFilename = `banner_${sanitizedTitle}.${ext}`;
        await downloadImage(item.banner_url, bannerFilename);
      }
    } else if (item.image_url) {
      const ext = item.image_url.split(".").pop()?.split(/[#?]/)[0] || "png";
      const sanitizedTitle = item.title.replace(/\s+/g, "_").toLowerCase();
      const filename = `${item.type}_${sanitizedTitle}.${ext}`;
      await downloadImage(item.image_url, filename);
    }

    // Update download count
    try {
      const tableName = item.type === "pair" ? "profile_pairs" : item.type === "emote" ? "emotes" : item.type === "wallpaper" ? "wallpapers" : "profiles";
      const { error } = await supabase
        .from(tableName)
        .update({ download_count: item.download_count + 1 })
        .eq("id", item.id);

      if (!error) {
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, download_count: i.download_count + 1 } : i
        ));
      }
    } catch (error) {
      console.error("Failed to update download count:", error);
    }
  }, [downloadImage]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    if (!user) return;

    const isCurrentlyFavorited = favorites.has(id);
    const newFavorites = new Set(favorites);

    // Optimistic update
    if (isCurrentlyFavorited) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);

    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("profile_id", id);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert([{ user_id: user.id, profile_id: id }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Failed to update favorites:", error);
      // Revert on error
      setFavorites(favorites);
    }
  }, [user, favorites]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emote": return <Sticker className="h-4 w-4 text-orange-400" />;
      case "wallpaper": return <ImageIcon className="h-4 w-4 text-green-400" />;
      case "pair": return <Layout className="h-4 w-4 text-purple-400" />;
      default: return <ImageIcon className="h-4 w-4 text-blue-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "emote": return "Emote";
      case "wallpaper": return "Wallpaper";
      case "pair": return "Profile Pair";
      default: return "Profile";
    }
  };

  const openPreview = (item: TaggedItem) => {
    setPreviewItem(item);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Hash className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Tag: <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{decodedTag}</span>
              </h1>
              <p className="text-slate-400 mt-1">
                {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"} found
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setSortBy("newest")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "newest"
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "popular"
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setSortBy("title")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "title"
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Title
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        {sortedItems.length === 0 ? (
          <div className="text-center py-16">
            <Hash className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-slate-400 mb-2">No content found</p>
            <p className="text-slate-500">No items have been tagged with "{decodedTag}" yet.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            : "space-y-4"
          }>
            {sortedItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all ${
                  viewMode === "list" ? "flex items-center gap-4 p-4" : ""
                }`}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-square relative overflow-hidden bg-slate-800 cursor-pointer" onClick={() => openPreview(item)}>
                      {item.type === "pair" && item.banner_url ? (
                        <div className="relative w-full h-full">
                          <img
                            src={item.banner_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {item.pfp_url && (
                            <div className="absolute top-2 right-2">
                              <img
                                src={item.pfp_url}
                                alt="PFP"
                                className="w-12 h-12 rounded-full border-2 border-white/30"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item);
                              }}
                              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4 text-white" />
                            </button>
                            {user && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  favorites.has(item.id)
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-slate-800/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400"
                                }`}
                                title={favorites.has(item.id) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Heart className={`h-4 w-4 ${favorites.has(item.id) ? "fill-current" : ""}`} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-white text-xs">
                            <Download className="h-3 w-3" />
                            <span>{item.download_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(item.type)}
                        <span className="text-xs text-slate-400">{getTypeLabel(item.type)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate mb-2">{item.title}</h3>
                      {(item.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-auto">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Link
                              key={tag}
                              to={`/browse/tag/${encodeURIComponent(tag)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-slate-500 px-2 py-0.5">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                      <Link
                        to={`/user/${item.user_profiles?.username || item.user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-xs text-slate-400 hover:text-purple-400 transition-colors group"
                      >
                        {item.user_profiles?.avatar_url ? (
                          <img
                            src={item.user_profiles.avatar_url}
                            alt={item.user_profiles.username || "User"}
                            className="w-6 h-6 rounded-full ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all">
                            <User className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                        <span className="truncate font-medium">
                          {item.user_profiles?.username || item.user_profiles?.display_name || "Unknown User"}
                        </span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 cursor-pointer" onClick={() => openPreview(item)}>
                      {item.type === "pair" && item.banner_url ? (
                        <img
                          src={item.banner_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(item.type)}
                        <span className="text-xs text-slate-400">{getTypeLabel(item.type)}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white truncate mb-2">{item.title}</h3>
                      {(item.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-auto">
                          {item.tags.slice(0, 4).map((tag) => (
                            <Link
                              key={tag}
                              to={`/browse/tag/${encodeURIComponent(tag)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                          {item.tags.length > 4 && (
                            <span className="text-xs text-slate-500 px-2 py-0.5">+{item.tags.length - 4}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{item.download_count} downloads</span>
                        </div>
                        {user && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className={`flex items-center gap-1 transition-colors ${
                              favorites.has(item.id)
                                ? "text-red-400"
                                : "text-slate-400 hover:text-red-400"
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${favorites.has(item.id) ? "fill-current" : ""}`} />
                            <span>Favorite</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                      <Link
                        to={`/user/${item.user_profiles?.username || item.user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors group"
                      >
                        {item.user_profiles?.avatar_url ? (
                          <img
                            src={item.user_profiles.avatar_url}
                            alt={item.user_profiles.username || "User"}
                            className="w-7 h-7 rounded-full ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <span className="truncate font-medium">
                          by {item.user_profiles?.username || item.user_profiles?.display_name || "Unknown User"}
                        </span>
                      </Link>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closePreview}>
          <div className="min-h-screen px-4 text-center bg-black bg-opacity-80 backdrop-blur-sm">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="inline-block w-full max-w-4xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
                <div className="relative">
                  {previewItem && (
                    <>
                      {previewItem.type === "pair" && previewItem.banner_url ? (
                        <div className="relative w-full bg-slate-800">
                          <img
                            src={previewItem.banner_url}
                            alt={previewItem.title}
                            className="w-full h-96 object-cover"
                            loading="lazy"
                          />
                          {previewItem.pfp_url && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                              <img
                                src={previewItem.pfp_url}
                                alt="PFP"
                                className="w-32 h-32 rounded-full border-4 border-slate-900 shadow-2xl"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <img
                          src={previewItem.image_url || "/placeholder.svg"}
                          alt={previewItem.title}
                          className="w-full h-96 object-contain bg-slate-800"
                          loading="lazy"
                        />
                      )}
                    </>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={closePreview}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {previewItem && (
                  <div className="p-8">
                    <Dialog.Title as="h3" className="text-3xl font-bold text-white mb-4">
                      {previewItem.title}
                    </Dialog.Title>

                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(previewItem.type)}
                        <span>{getTypeLabel(previewItem.type)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{previewItem.download_count} downloads</span>
                      </div>
                      {previewItem.user_profiles && (
                        <Link
                          to={`/user/${previewItem.user_profiles.username || previewItem.user_id}`}
                          className="flex items-center gap-2 hover:text-purple-400 transition-colors"
                        >
                          {previewItem.user_profiles.avatar_url ? (
                            <img
                              src={previewItem.user_profiles.avatar_url}
                              alt={previewItem.user_profiles.username || "User"}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <span>{previewItem.user_profiles.username || previewItem.user_profiles.display_name || "Unknown User"}</span>
                        </Link>
                      )}
                    </div>

                    {(previewItem.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {previewItem.tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/browse/tag/${encodeURIComponent(tag)}`}
                            className="bg-purple-700/30 text-purple-200 text-sm px-3 py-1 rounded-full border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => previewItem && handleDownload(previewItem)}
                        className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        type="button"
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </button>
                      {user && (
                        <button
                          onClick={() => previewItem && toggleFavorite(previewItem.id)}
                          className={`inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            previewItem && favorites.has(previewItem.id)
                              ? "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
                              : "text-slate-300 bg-slate-700 hover:bg-slate-600 focus:ring-slate-500"
                          }`}
                          type="button"
                        >
                          <Heart className={`h-5 w-5 ${previewItem && favorites.has(previewItem.id) ? "fill-current" : ""}`} />
                          {previewItem && favorites.has(previewItem.id) ? "Remove from Favorites" : "Add to Favorites"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
                        onClick={closePreview}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

