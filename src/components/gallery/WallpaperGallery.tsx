import { useState, useEffect, memo, useCallback, useMemo, Fragment } from "react"
import { motion } from "framer-motion"
import { Dialog, Transition } from "@headlessui/react"
import { Link } from "react-router-dom"
import { Search, Filter, Grid3X3, List, Download, Heart, User, Tag, Calendar, Monitor, X } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/authContext"
import Footer from "../Footer"

interface UserProfile {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

interface Wallpaper {
  id: string
  title: string
  image_url: string
  category: string
  resolution: string | null
  tags: string[] | null
  download_count: number | null
  created_at: string | null
  user_id: string
  user_profiles?: UserProfile
}

const WallpaperGallery = memo(function WallpaperGallery() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAnimatedOnly, setShowAnimatedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "title">("newest")
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const { user } = useAuth()
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const [categories, setCategories] = useState([
    { value: "all", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "desktop", label: "Desktop" },
    { value: "mobile", label: "Mobile" },
    { value: "gaming", label: "Gaming" },
    { value: "anime", label: "Anime" },
    { value: "abstract", label: "Abstract" },
  ])

  useEffect(() => {
    fetchWallpapers()
    fetchCategories()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedTags, selectedCategory, showAnimatedOnly])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("wallpapers")
        .select("category")
        .not("category", "is", null)

      if (error) throw error

      // Get unique categories
      const uniqueCategories = Array.from(new Set(data?.map(item => item.category).filter(Boolean))) || []
      
      // Create category options
      const defaultCategories = [
        { value: "all", label: "All Categories" },
        { value: "general", label: "General" },
        { value: "desktop", label: "Desktop" },
        { value: "mobile", label: "Mobile" },
        { value: "gaming", label: "Gaming" },
        { value: "anime", label: "Anime" },
        { value: "abstract", label: "Abstract" },
      ]

      // Add custom categories that aren't already in defaults
      const customCategories = uniqueCategories
        .filter(cat => !defaultCategories.some(def => def.value === cat))
        .map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))

      setCategories([...defaultCategories, ...customCategories])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchWallpapers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch without join to avoid relationship errors
      const { data, error } = await supabase
        .from("wallpapers")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching wallpapers:", error)
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          setError("Wallpapers table not found. Please run the database migration first.")
        } else {
          setError(`Failed to fetch wallpapers: ${error.message || "Unknown error"}`)
        }
        setWallpapers([])
        return
      }

      const wallpapersData: Wallpaper[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        category: item.category,
        resolution: item.resolution,
        tags: Array.isArray(item.tags) ? item.tags : [],
        download_count: item.download_count || 0,
        created_at: item.created_at,
        user_id: item.user_id,
      }))

      // Fetch user profiles for all wallpapers
      const userIds = [...new Set(wallpapersData.map(w => w.user_id))];
      if (userIds.length > 0) {
        const { data: userProfiles } = await supabase
          .from("user_profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);

        const userMap = new Map(userProfiles?.map(up => [up.user_id, up]) || []);
        
        wallpapersData.forEach(wallpaper => {
          wallpaper.user_profiles = userMap.get(wallpaper.user_id);
        });
      }

      setWallpapers(wallpapersData)
    } catch (error: any) {
      console.error("Error fetching wallpapers:", error)
      if (error?.message?.includes("relation") && error?.message?.includes("does not exist")) {
        setError("Wallpapers table not found. Please run the database migration first.")
      } else {
        setError(`Failed to fetch wallpapers: ${error?.message || "Unknown error"}`)
      }
      setWallpapers([])
    } finally {
      setLoading(false)
    }
  }

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    wallpapers.forEach((wallpaper) => {
      wallpaper.tags?.forEach((tag) => tagsSet.add(tag.toLowerCase().trim()))
    })
    return Array.from(tagsSet).sort()
  }, [wallpapers])

  const isAnimatedImage = (url: string) => {
    return url.toLowerCase().includes('.gif') || url.toLowerCase().includes('animated')
  }

  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter((wallpaper) => {
      const matchesSearch =
        searchQuery === "" ||
        wallpaper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wallpaper.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wallpaper.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTags =
        selectedTags.size === 0 || wallpaper.tags?.some((tag) => selectedTags.has(tag.toLowerCase().trim()))

      const matchesCategory = selectedCategory === "all" || wallpaper.category === selectedCategory

      const matchesAnimated = !showAnimatedOnly || isAnimatedImage(wallpaper.image_url)

      return matchesSearch && matchesTags && matchesCategory && matchesAnimated
    })
  }, [wallpapers, searchQuery, selectedTags, selectedCategory, showAnimatedOnly])

  const sortedWallpapers = useMemo(() => {
    const sorted = [...filteredWallpapers]
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case "popular":
        return sorted.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return sorted
    }
  }, [filteredWallpapers, sortBy])

  const pagedWallpapers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return sortedWallpapers.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedWallpapers, page])

  // Load favorites from database
  useEffect(() => {
    if (user?.id) {
      async function loadFavorites() {
        try {
          const { data, error } = await supabase
            .from("favorites")
            .select("wallpaper_id")
            .eq("user_id", user.id)
            .not("wallpaper_id", "is", null);

          if (!error && data) {
            setFavorites(new Set(data.map(f => f.wallpaper_id).filter(Boolean)));
          }
        } catch (err) {
          console.error("Error loading favorites:", err);
        }
      }
      loadFavorites();
    }
  }, [user]);

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

  const handleDownloadWallpaper = useCallback(async (wallpaper: Wallpaper) => {
    if (wallpaper.image_url) {
      const ext = wallpaper.image_url.split(".").pop()?.split(/[#?]/)[0] || "png";
      const sanitizedTitle = wallpaper.title.replace(/\s+/g, "_").toLowerCase();
      const filename = `wallpaper_${sanitizedTitle}.${ext}`;
      await downloadImage(wallpaper.image_url, filename);
    }

    // Update download count
    try {
      const { error } = await supabase
        .from("wallpapers")
        .update({ download_count: (wallpaper.download_count || 0) + 1 })
        .eq("id", wallpaper.id);

      if (!error) {
        setWallpapers(prev => prev.map(w => 
          w.id === wallpaper.id ? { ...w, download_count: (w.download_count || 0) + 1 } : w
        ));
      }
    } catch (error) {
      console.error("Failed to update download count:", error);
    }
  }, [downloadImage]);

  const handleFavorite = useCallback(async (wallpaperId: string) => {
    if (!user) return

    const isCurrentlyFavorited = favorites.has(wallpaperId);
    const newFavorites = new Set(favorites);

    // Optimistic update
    if (isCurrentlyFavorited) {
      newFavorites.delete(wallpaperId);
    } else {
      newFavorites.add(wallpaperId);
    }
    setFavorites(newFavorites);

    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("wallpaper_id", wallpaperId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert([{ user_id: user.id, wallpaper_id: wallpaperId }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Failed to update favorites:", error);
      // Revert on error
      setFavorites(favorites);
    }
  }, [user, favorites])

  const openPreview = (wallpaper: Wallpaper) => {
    setPreviewWallpaper(wallpaper);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewWallpaper(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading wallpapers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">Error loading wallpapers</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchWallpapers()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Wallpaper Gallery
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Discover stunning wallpapers for desktop, mobile, and gaming setups
          </p>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-slate-600/50 shadow-2xl">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search titles, categories, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-lg backdrop-blur-sm"
                aria-label="Search wallpapers" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-600 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Animated Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="text-purple-400">🎬</span> Animated Content
              </label>
              <button
                onClick={() => setShowAnimatedOnly(!showAnimatedOnly)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  showAnimatedOnly
                    ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25"
                    : "bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white"
                }`}
              >
                {showAnimatedOnly ? "🎬 Animated Only" : "🎬 Show All"}
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="text-purple-400">📁</span> Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="text-purple-400">🔀</span> Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "popular" | "title")}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="text-purple-400">👁️</span> View Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    viewMode === "grid"
                      ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25"
                      : "bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    viewMode === "list"
                      ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25"
                      : "bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white"
                  }`}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Filter by Tags */}
          {allTags.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <span className="text-purple-400">🏷️</span> Filter by tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 20).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newSelectedTags = new Set(selectedTags)
                      if (newSelectedTags.has(tag)) {
                        newSelectedTags.delete(tag)
                      } else {
                        newSelectedTags.add(tag)
                      }
                      setSelectedTags(newSelectedTags)
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${
                      selectedTags.has(tag)
                        ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25"
                        : "bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {allTags.length > 20 && (
                  <span className="px-3 py-1 text-slate-400 text-sm">
                    +{allTags.length - 20} more tags
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {(searchQuery || selectedTags.size > 0 || selectedCategory !== "all" || showAnimatedOnly) && (
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>
                    Showing {filteredWallpapers.length} of {wallpapers.length} wallpapers
                  </span>
                  {(searchQuery || selectedTags.size > 0 || selectedCategory !== "all" || showAnimatedOnly) && (
                    <span className="text-purple-400">•</span>
                  )}
                  {searchQuery && (
                    <span className="text-purple-400">"{searchQuery}"</span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="text-purple-400">
                      {categories.find(c => c.value === selectedCategory)?.label}
                    </span>
                  )}
                  {showAnimatedOnly && (
                    <span className="text-purple-400">Animated Only</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedTags(new Set())
                    setSelectedCategory("all")
                    setShowAnimatedOnly(false)
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wallpapers Grid/List */}
        {pagedWallpapers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No wallpapers found</h3>
            <p className="text-slate-400">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to upload a wallpaper!"}
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-4"}>
            {pagedWallpapers.map((wallpaper, index) => (
              <motion.div
                key={wallpaper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all ${
                  viewMode === "list" ? "flex items-center gap-4 p-4" : ""
                }`}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-square relative overflow-hidden bg-slate-800 cursor-pointer" onClick={() => openPreview(wallpaper)}>
                      <img
                        src={wallpaper.image_url}
                        alt={wallpaper.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadWallpaper(wallpaper);
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
                                  handleFavorite(wallpaper.id);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  favorites.has(wallpaper.id)
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-slate-800/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400"
                                }`}
                                title={favorites.has(wallpaper.id) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Heart className={`h-4 w-4 ${favorites.has(wallpaper.id) ? "fill-current" : ""}`} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-white text-xs">
                            <Download className="h-3 w-3" />
                            <span>{wallpaper.download_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-white truncate mb-2">{wallpaper.title}</h3>
                      {(wallpaper.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-auto">
                          {wallpaper.tags.slice(0, 3).map((tag) => (
                            <Link
                              key={tag}
                              to={`/browse/tag/${encodeURIComponent(tag)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                          {wallpaper.tags.length > 3 && (
                            <span className="text-xs text-slate-500 px-2 py-0.5">+{wallpaper.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                      {wallpaper.user_profiles && (
                        <Link
                          to={`/user/${wallpaper.user_profiles.username || wallpaper.user_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-xs text-slate-400 hover:text-purple-400 transition-colors group"
                        >
                          {wallpaper.user_profiles.avatar_url ? (
                            <img
                              src={wallpaper.user_profiles.avatar_url}
                              alt={wallpaper.user_profiles.username || "User"}
                              className="w-6 h-6 rounded-full ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          <span className="truncate font-medium">
                            {wallpaper.user_profiles.username || wallpaper.user_profiles.display_name || "Unknown User"}
                          </span>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 cursor-pointer" onClick={() => openPreview(wallpaper)}>
                      <img
                        src={wallpaper.image_url}
                        alt={wallpaper.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate mb-2">{wallpaper.title}</h3>
                      {(wallpaper.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-auto">
                          {wallpaper.tags.slice(0, 4).map((tag) => (
                            <Link
                              key={tag}
                              to={`/browse/tag/${encodeURIComponent(tag)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                          {wallpaper.tags.length > 4 && (
                            <span className="text-xs text-slate-500 px-2 py-0.5">+{wallpaper.tags.length - 4}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{wallpaper.download_count || 0} downloads</span>
                        </div>
                        {user && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavorite(wallpaper.id);
                            }}
                            className={`flex items-center gap-1 transition-colors ${
                              favorites.has(wallpaper.id)
                                ? "text-red-400"
                                : "text-slate-400 hover:text-red-400"
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${favorites.has(wallpaper.id) ? "fill-current" : ""}`} />
                            <span>Favorite</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadWallpaper(wallpaper);
                          }}
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                      {wallpaper.user_profiles && (
                        <Link
                          to={`/user/${wallpaper.user_profiles.username || wallpaper.user_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors group"
                        >
                          {wallpaper.user_profiles.avatar_url ? (
                            <img
                              src={wallpaper.user_profiles.avatar_url}
                              alt={wallpaper.user_profiles.username || "User"}
                              className="w-7 h-7 rounded-full ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <span className="truncate font-medium">
                            by {wallpaper.user_profiles.username || wallpaper.user_profiles.display_name || "Unknown User"}
                          </span>
                        </Link>
                      )}
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
                  {previewWallpaper && (
                    <img
                      src={previewWallpaper.image_url || "/placeholder.svg"}
                      alt={previewWallpaper.title}
                      className="w-full h-96 object-contain bg-slate-800"
                      loading="lazy"
                    />
                  )}

                  {/* Close Button */}
                  <button
                    onClick={closePreview}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {previewWallpaper && (
                  <div className="p-8">
                    <Dialog.Title as="h3" className="text-3xl font-bold text-white mb-4">
                      {previewWallpaper.title}
                    </Dialog.Title>

                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{previewWallpaper.download_count || 0} downloads</span>
                      </div>
                      {previewWallpaper.resolution && (
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                          {previewWallpaper.resolution}
                        </span>
                      )}
                      {previewWallpaper.user_profiles && (
                        <Link
                          to={`/user/${previewWallpaper.user_profiles.username || previewWallpaper.user_id}`}
                          className="flex items-center gap-2 hover:text-purple-400 transition-colors"
                        >
                          {previewWallpaper.user_profiles.avatar_url ? (
                            <img
                              src={previewWallpaper.user_profiles.avatar_url}
                              alt={previewWallpaper.user_profiles.username || "User"}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <span>{previewWallpaper.user_profiles.username || previewWallpaper.user_profiles.display_name || "Unknown User"}</span>
                        </Link>
                      )}
                    </div>

                    {(previewWallpaper.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {previewWallpaper.tags.map((tag) => (
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
                        onClick={() => previewWallpaper && handleDownloadWallpaper(previewWallpaper)}
                        className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        type="button"
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </button>
                      {user && (
                        <button
                          onClick={() => previewWallpaper && handleFavorite(previewWallpaper.id)}
                          className={`inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            previewWallpaper && favorites.has(previewWallpaper.id)
                              ? "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
                              : "text-slate-300 bg-slate-700 hover:bg-slate-600 focus:ring-slate-500"
                          }`}
                          type="button"
                        >
                          <Heart className={`h-5 w-5 ${previewWallpaper && favorites.has(previewWallpaper.id) ? "fill-current" : ""}`} />
                          {previewWallpaper && favorites.has(previewWallpaper.id) ? "Remove from Favorites" : "Add to Favorites"}
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
      <Footer />
    </div>
  )
})

export default WallpaperGallery