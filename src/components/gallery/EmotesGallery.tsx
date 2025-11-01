import { useState, useEffect, memo, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Grid3X3, List, Download, Heart, User, Tag, Calendar } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/authContext"
import Footer from "../Footer"

interface Emote {
  id: string
  title: string
  image_url: string
  category: string
  tags: string[] | null
  download_count: number | null
  created_at: string | null
  user_id: string
  user_profiles?: {
    username: string | null
    avatar_url: string | null
  }
}

const EmotesGallery = memo(function EmotesGallery() {
  const [emotes, setEmotes] = useState<Emote[]>([])
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

  const [categories, setCategories] = useState([
    { value: "all", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "discord", label: "Discord" },
    { value: "twitch", label: "Twitch" },
  ])

  useEffect(() => {
    fetchEmotes()
    fetchCategories()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedTags, selectedCategory, showAnimatedOnly])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("emotes")
        .select("category")
        .not("category", "is", null)

      if (error) throw error

      // Get unique categories
      const uniqueCategories = Array.from(new Set(data?.map(item => item.category).filter(Boolean))) || []
      
      // Create category options
      const defaultCategories = [
        { value: "all", label: "All Categories" },
        { value: "general", label: "General" },
        { value: "discord", label: "Discord" },
        { value: "twitch", label: "Twitch" },
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

  const fetchEmotes = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from("emotes")
        .select(`
          *,
          user_profiles (
            username,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setEmotes(data || [])
    } catch (error) {
      console.error("Error fetching emotes:", error)
      // Check if it's a table doesn't exist error
      if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
        setError("Emotes table not found. Please run the database migration first.")
      } else {
        setError("Failed to fetch emotes")
      }
    } finally {
      setLoading(false)
    }
  }

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    emotes.forEach((emote) => {
      emote.tags?.forEach((tag) => tagsSet.add(tag.toLowerCase().trim()))
    })
    return Array.from(tagsSet).sort()
  }, [emotes])

  const isAnimatedImage = (url: string) => {
    return url.toLowerCase().includes('.gif') || url.toLowerCase().includes('animated')
  }

  const filteredEmotes = useMemo(() => {
    return emotes.filter((emote) => {
      const matchesSearch =
        searchQuery === "" ||
        emote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emote.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emote.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTags =
        selectedTags.size === 0 || emote.tags?.some((tag) => selectedTags.has(tag.toLowerCase().trim()))

      const matchesCategory = selectedCategory === "all" || emote.category === selectedCategory

      const matchesAnimated = !showAnimatedOnly || isAnimatedImage(emote.image_url)

      return matchesSearch && matchesTags && matchesCategory && matchesAnimated
    })
  }, [emotes, searchQuery, selectedTags, selectedCategory, showAnimatedOnly])

  const sortedEmotes = useMemo(() => {
    const sorted = [...filteredEmotes]
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
  }, [filteredEmotes, sortBy])

  const pagedEmotes = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return sortedEmotes.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedEmotes, page])

  const handleDownload = useCallback(async (emoteId: string) => {
    try {
      // Increment download count
      const { error } = await supabase.rpc("increment_download_count", {
        table_name: "emotes",
        record_id: emoteId,
      })

      if (error) throw error

      // Update local state
      setEmotes(prev =>
        prev.map(emote =>
          emote.id === emoteId
            ? { ...emote, download_count: (emote.download_count || 0) + 1 }
            : emote
        )
      )
    } catch (error) {
      console.error("Error updating download count:", error)
    }
  }, [])

  const handleFavorite = useCallback(async (emoteId: string) => {
    if (!user) return

    try {
      // Check if already favorited
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("emote_id", emoteId)
        .eq("user_id", user.id)
        .single()

      if (existing) {
        // Remove from favorites
        await supabase.from("favorites").delete().eq("id", existing.id)
      } else {
        // Add to favorites
        await supabase.from("favorites").insert({
          emote_id: emoteId,
          user_id: user.id,
          content_type: "emote",
        })
      }

      // Refresh data
      fetchEmotes()
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }, [user, fetchEmotes])

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
          <p className="text-white text-lg">Loading emotes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">Error loading emotes</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchEmotes()}
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
            Emotes Gallery
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Discover and download custom emotes for Discord, Twitch, and more
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
                aria-label="Search emotes" />
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
                    Showing {filteredEmotes.length} of {emotes.length} emotes
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

        {/* Emotes Grid/List */}
        {pagedEmotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No emotes found</h3>
            <p className="text-slate-400">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to upload an emote!"}
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "space-y-4"
            }
          >
            {pagedEmotes.map((emote) => (
              <motion.div
                key={emote.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-slate-700/50 transition-all duration-300 border border-slate-700 hover:border-slate-600 ${
                  viewMode === "list" ? "flex items-center p-4" : ""
                }`}
              >
                {viewMode === "grid" ? (
                  <>
                    {/* Grid View */}
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={emote.image_url}
                        alt={emote.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                      
                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                        <button
                          onClick={() => handleDownload(emote.id)}
                          className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-white transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {user && (
                          <button
                            onClick={() => handleFavorite(emote.id)}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-white transition-colors"
                            title="Add to Favorites"
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-2 truncate">{emote.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <User className="h-4 w-4" />
                        <span>{emote.user_profiles?.username || "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Download className="h-4 w-4" />
                          <span>{emote.download_count || 0}</span>
                        </div>
                        <span className="text-purple-400 capitalize">{emote.category}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={emote.image_url}
                        alt={emote.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 ml-4">
                      <h3 className="font-semibold text-white mb-1">{emote.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{emote.user_profiles?.username || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{emote.download_count || 0} downloads</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{emote.created_at ? formatDate(emote.created_at) : "Unknown"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400 capitalize text-sm">{emote.category}</span>
                        {emote.tags && emote.tags.length > 0 && (
                          <div className="flex gap-1">
                            {emote.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                            {emote.tags.length > 3 && (
                              <span className="text-slate-400 text-xs">
                                +{emote.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
      </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(emote.id)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      {user && (
                        <button
                          onClick={() => handleFavorite(emote.id)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                          title="Add to Favorites"
                        >
                          <Heart className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  )
})

export default EmotesGallery