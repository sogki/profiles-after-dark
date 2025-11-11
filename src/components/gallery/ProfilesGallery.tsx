import { useState, useEffect, useMemo, Fragment, useCallback } from "react"
import { Download, Heart, Eye, Search, Clock, Tag, Grid3X3, List, Palette, Layout, User } from "lucide-react"
import { Dialog, Transition } from "@headlessui/react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../../context/authContext"
import { supabase } from "../../lib/supabase"

import Footer from "../Footer"

interface ProfilePair {
  id: string
  user_id?: string
  title: string
  category?: string
  tags?: string[]
  pfp_url: string
  banner_url: string
  download_count?: number
  created_at?: string
  updated_at?: string
  color?: string
  user_profiles?: {
    username: string | null
    avatar_url: string | null
  }
}

const FAVORITES_STORAGE_KEY = "profile_favorites"

// Skeleton Loading Component
const ProfileCardSkeleton = () => (
  <div className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
    <div className="w-full h-40 bg-gray-700" />
    <div className="w-24 h-24 bg-gray-700 rounded-full border-4 border-gray-800 absolute top-28 left-1/2 transform -translate-x-1/2" />
    <div className="pt-20 pb-6 px-6 text-center space-y-3">
      <div className="h-6 bg-gray-700 rounded mx-auto w-3/4" />
      <div className="flex justify-center gap-2">
        <div className="h-5 bg-gray-700 rounded w-12" />
        <div className="h-5 bg-gray-700 rounded w-16" />
      </div>
      <div className="flex justify-center gap-5 pt-2">
        <div className="h-8 w-8 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
      </div>
    </div>
  </div>
)

export default function ProfilesGallery() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<ProfilePair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedColor, setSelectedColor] = useState<string | "all">("all")
  const [showAnimatedOnly, setShowAnimatedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Hover state for animated content
  const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [previewProfile, setPreviewProfile] = useState<ProfilePair | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`${FAVORITES_STORAGE_KEY}_${user.id}`)
      if (saved) {
        try {
          const favArray: string[] = JSON.parse(saved)
          setFavorites(new Set(favArray))
        } catch {
          setFavorites(new Set())
        }
      }
    } else {
      setFavorites(new Set())
    }
  }, [user])

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`${FAVORITES_STORAGE_KEY}_${user.id}`, JSON.stringify(Array.from(favorites)))
    }
  }, [favorites, user])

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true)
      setError(null)
      try {
        // Fetch without join to avoid relationship errors
        const { data, error } = await supabase
          .from("profile_pairs")
          .select("*")
          .not("pfp_url", "is", null)
          .not("banner_url", "is", null)
          .neq("pfp_url", "")
          .neq("banner_url", "")
          .order("updated_at", { ascending: false })

        if (error) {
          console.error("Error fetching profile combos:", error)
          setError(`Failed to fetch profile combos: ${error.message || "Unknown error"}`)
          setLoading(false)
          return
        }

        if (!data || data.length === 0) {
          setProfiles([])
          setLoading(false)
          return
        }

        const profilesData: ProfilePair[] = (data || []).map((item: any) => {
          let tags: string[] = []
          try {
            if (Array.isArray(item.tags)) {
              tags = item.tags
            } else if (item.tags) {
              if (typeof item.tags === 'string' && item.tags.includes("[")) {
                tags = JSON.parse(item.tags)
              } else if (typeof item.tags === 'string') {
                tags = item.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
              }
            }
          } catch (e) {
            console.error("Error parsing tags for item", item.id, e)
          }

          return {
            id: item.id,
            user_id: item.user_id,
            title: item.title || "Untitled Profile Combo",
            category: item.category || "General",
            tags,
            pfp_url: item.pfp_url,
            banner_url: item.banner_url,
            download_count: item.download_count || 0,
            created_at: item.created_at,
            updated_at: item.updated_at,
            color: item.color || undefined,
            user_profiles: item.user_profiles || undefined,
          }
        })

        setProfiles(profilesData)
      } catch (err: any) {
        console.error("Unexpected error loading profile combos:", err)
        setError(`Unexpected error loading profile combos: ${err?.message || "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [])

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    profiles.forEach((p) => p.tags?.forEach((tag) => tagsSet.add(tag.toLowerCase().trim())))
    return Array.from(tagsSet)
      .filter((tag) => tag.length > 0)
      .sort((a, b) => a.localeCompare(b))
  }, [profiles])

  const allColors = useMemo(() => {
    const colorsSet = new Set<string>()
    profiles.forEach((p) => {
      if (p.color) colorsSet.add(p.color)
    })
    return Array.from(colorsSet).sort()
  }, [profiles])

  // Helper function to check if content is animated
  const isAnimatedImage = (url: string) => {
    return url.toLowerCase().includes('.gif')
  }

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        searchQuery === "" ||
        profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (profile.category && profile.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        profile.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTags =
        selectedTags.size === 0 || profile.tags?.some((tag) => selectedTags.has(tag.toLowerCase().trim()))

      const matchesColor = selectedColor === "all" || profile.color === selectedColor

      const matchesAnimated = !showAnimatedOnly || isAnimatedImage(profile.pfp_url) || isAnimatedImage(profile.banner_url)

      return matchesSearch && matchesTags && matchesColor && matchesAnimated
    })
  }, [profiles, searchQuery, selectedTags, selectedColor, showAnimatedOnly])

  const pagedProfiles = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredProfiles.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProfiles, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedTags, selectedColor])

  async function downloadImage(url: string, filename: string) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Network response not ok")
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("Error downloading image:", error)
      alert("Failed to download image.")
    }
  }

  const handleDownloadBoth = useCallback(async (profile: ProfilePair) => {
    if (profile.pfp_url) {
      const extPfp = profile.pfp_url.split(".").pop()?.split(/[#?]/)[0] || "png"
      const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase()
      const pfpFilename = `pfp_${sanitizedTitle}.${extPfp}`
      await downloadImage(profile.pfp_url, pfpFilename)
    }
    if (profile.banner_url) {
      const extBanner = profile.banner_url.split(".").pop()?.split(/[#?]/)[0] || "png"
      const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase()
      const bannerFilename = `banner_${sanitizedTitle}.${extBanner}`
      await downloadImage(profile.banner_url, bannerFilename)
    }

    // Update download count in database
    try {
      const { error } = await supabase.rpc("increment_download_count", {
        table_name: "profile_pairs",
        record_id: profile.id,
      })

      if (!error) {
        // Update local state
        setProfiles((prev) =>
          prev.map((p) => (p.id === profile.id ? { ...p, download_count: (p.download_count || 0) + 1 } : p)),
        )
      }
    } catch (error) {
      console.error("Failed to update download count:", error)
    }
  }, [])

  const handleFavorite = async (profileId: string) => {
    if (!user) return

    const isCurrentlyFavorited = favorites.has(profileId)

    // Update local state immediately for better UX
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(profileId)) {
        newFavorites.delete(profileId)
      } else {
        newFavorites.add(profileId)
      }
      return newFavorites
    })

    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("profile_id", profileId)
        if (error) throw error
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert([
          {
            user_id: user.id,
            profile_id: profileId,
          },
        ])
        if (error) throw error
      }
    } catch (error) {
      console.error("Failed to update favorites:", error)
      // Revert local state on error
      setFavorites((prev) => {
        const newFavorites = new Set(prev)
        if (isCurrentlyFavorited) {
          newFavorites.add(profileId)
        } else {
          newFavorites.delete(profileId)
        }
        return newFavorites
      })
    }
  }

  const openPreview = (profile: ProfilePair) => {
    setPreviewProfile(profile)
    setIsModalOpen(true)
  }

  const closePreview = () => {
    setIsModalOpen(false)
    setPreviewProfile(null)
  }

  const toggleTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim()
    setSelectedTags((prev) => {
      const newTags = new Set(prev)
      if (newTags.has(normalizedTag)) {
        newTags.delete(normalizedTag)
      } else {
        newTags.add(normalizedTag)
      }
      return newTags
    })
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedTags(new Set())
  }

  const retryFetch = () => {
    setError(null)
    setLoading(true)
    // Trigger re-fetch by updating a dependency
    window.location.reload()
  }

  const renderSkeletonCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
          <div className="w-full h-40 bg-slate-700" />
          <div className="w-24 h-24 rounded-full bg-slate-700 absolute top-28 left-1/2 transform -translate-x-1/2 border-4 border-slate-600" />
          <div className="pt-20 pb-6 px-6 text-center space-y-3">
            <div className="h-6 bg-slate-700 rounded mx-auto w-3/4" />
            <div className="flex justify-center gap-2">
              <div className="h-5 bg-slate-700 rounded-full w-16" />
              <div className="h-5 bg-slate-700 rounded-full w-20" />
            </div>
            <div className="flex justify-center gap-5 pt-2">
              <div className="w-8 h-8 bg-slate-700 rounded" />
              <div className="w-8 h-8 bg-slate-700 rounded" />
              <div className="w-8 h-8 bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-gallery>
      {/* Enhanced Header */}
      <div className="mb-8">
        <h2 className="text-white text-4xl font-bold mb-2">Profile Combos Gallery</h2>
        <p className="text-gray-400 text-lg">
          Discover and download complete profile sets with matching PFPs and banners • {filteredProfiles.length} combos
          available
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
              aria-label="Search profile combos" />
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

          {/* Color Filter */}
          {allColors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Palette className="inline h-4 w-4 mr-1" />
                Color
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              >
                <option value="all">All Colors</option>
                {allColors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">View Mode</label>
            <div className="flex rounded-lg bg-slate-700/50 border border-slate-600/50 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "grid"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-600/50 hover:text-white"}`}
              >
                <Grid3X3 className="h-4 w-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "list"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-600/50 hover:text-white"}`}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Tag className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-lg font-semibold text-white">Filter by tags</span>
              </div>
              {selectedTags.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-slate-400">{selectedTags.size} selected</span>
                  <button
                    onClick={() => setSelectedTags(new Set())}
                    className="px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all duration-200 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 20).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${selectedTags.has(tag)
                      ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25 scale-105"
                      : "bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white"}`}
                >
                  #{tag}
                </button>
              ))}
              {allTags.length > 20 && (
                <div className="px-4 py-2 text-sm text-slate-400 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  +{allTags.length - 20} more tags
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(searchQuery || selectedTags.size > 0 || selectedColor !== "all" || showAnimatedOnly) && (
          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>
                  Showing {filteredProfiles.length} of {profiles.length} profile combos
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTags(new Set())
                  setSelectedColor("all")
                  setShowAnimatedOnly(false)
                } }
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
              >
                Reset all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile combos grid/list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProfileCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md mx-auto">
            <Layout className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">No profile combos found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
            {(searchQuery || selectedTags.size > 0 || selectedColor !== "all" || showAnimatedOnly) && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTags(new Set())
                  setSelectedColor("all")
                  setShowAnimatedOnly(false)
                } }
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-4"}
          >
            {pagedProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all ${
                  viewMode === "list" ? "flex items-center gap-4 p-4" : ""
                }`}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-square relative overflow-hidden bg-slate-800 cursor-pointer" onClick={() => openPreview(profile)}>
                      {profile.banner_url ? (
                        <div className="relative w-full h-full">
                          <img
                            src={profile.banner_url}
                            alt={profile.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          {profile.pfp_url && (
                            <div className="absolute top-2 right-2">
                              <img
                                src={profile.pfp_url}
                                alt="PFP"
                                className="w-12 h-12 rounded-full border-2 border-white/30"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <span className="text-slate-400">No Banner</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadBoth(profile);
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
                                  handleFavorite(profile.id);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  favorites.has(profile.id)
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-slate-800/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400"
                                }`}
                                title={favorites.has(profile.id) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Heart className={`h-4 w-4 ${favorites.has(profile.id) ? "fill-current" : ""}`} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-white text-xs">
                            <Download className="h-3 w-3" />
                            <span>{profile.download_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-white truncate mb-2">{profile.title}</h3>
                      {(profile.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-auto">
                          {profile.tags.slice(0, 3).map((tag) => (
                            <Link
                              key={tag}
                              to={`/browse/tag/${encodeURIComponent(tag)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                          {profile.tags.length > 3 && (
                            <span className="text-xs text-slate-500 px-2 py-0.5">+{profile.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                      {profile.user_profiles?.username && (
                        <Link
                          to={`/user/${profile.user_profiles.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-xs text-slate-400 hover:text-purple-400 transition-colors group"
                        >
                          {profile.user_profiles.avatar_url ? (
                            <img
                              src={profile.user_profiles.avatar_url}
                              alt={profile.user_profiles.username}
                              className="w-6 h-6 rounded-full ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          <span className="truncate font-medium">
                            {profile.user_profiles.username || profile.user_profiles.display_name || "Unknown User"}
                          </span>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 cursor-pointer" onClick={() => openPreview(profile)}>
                      <img
                        src={profile.banner_url || "/placeholder.svg"}
                        alt={profile.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate mb-2">{profile.title}</h3>
                      {(profile.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-auto">
                          {profile.tags.slice(0, 4).map((tag) => (
                            <Link
                              key={tag}
                              to={`/browse/tag/${encodeURIComponent(tag)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                          {profile.tags.length > 4 && (
                            <span className="text-xs text-slate-500 px-2 py-0.5">+{profile.tags.length - 4}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{profile.download_count || 0} downloads</span>
                        </div>
                        {user && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavorite(profile.id);
                            }}
                            className={`flex items-center gap-1 transition-colors ${
                              favorites.has(profile.id)
                                ? "text-red-400"
                                : "text-slate-400 hover:text-red-400"
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${favorites.has(profile.id) ? "fill-current" : ""}`} />
                            <span>Favorite</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadBoth(profile);
                          }}
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                      {profile.user_profiles?.username && (
                        <Link
                          to={`/user/${profile.user_profiles.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors group"
                        >
                          {profile.user_profiles.avatar_url ? (
                            <img
                              src={profile.user_profiles.avatar_url}
                              alt={profile.user_profiles.username}
                              className="w-7 h-7 rounded-full ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <span className="truncate font-medium">
                            by {profile.user_profiles.username || profile.user_profiles.display_name || "Unknown User"}
                          </span>
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {filteredProfiles.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                aria-label="Previous page"
                type="button"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)) }).map(
                  (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-12 h-12 rounded-lg font-medium transition-colors ${page === pageNum
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}
                      >
                        {pageNum}
                      </button>
                    )
                  }
                )}
                {Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE) > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => setPage(Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE))}
                      className={`w-12 h-12 rounded-lg font-medium transition-colors ${page === Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}
                    >
                      {Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)))}
                disabled={page === Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                aria-label="Next page"
                type="button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Enhanced Preview Modal */}
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
              <Dialog.Panel className="inline-block w-full max-w-6xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
                <div className="relative">
                  {previewProfile?.banner_url && (
                    <img
                      src={previewProfile.banner_url || "/placeholder.svg"}
                      alt={`${previewProfile.title} banner`}
                      className="w-full h-64 object-cover"
                      loading="lazy" />
                  )}

                  {previewProfile?.pfp_url && (
                    <img
                      src={previewProfile.pfp_url || "/placeholder.svg"}
                      alt={`${previewProfile.title} profile`}
                      className="w-32 h-32 rounded-full border-4 border-purple-500 absolute top-48 left-1/2 transform -translate-x-1/2 bg-slate-900 shadow-xl"
                      loading="lazy" />
                  )}

                  {/* Close Button */}
                  <button
                    onClick={closePreview}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="pt-20 pb-8 px-8">
                  <Dialog.Title as="h3" className="text-3xl font-bold leading-12 text-white mb-5">
                    {previewProfile?.title}
                  </Dialog.Title>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    {previewProfile?.category && (
                      <div className="flex items-center gap-1">
                        <span className="text-purple-300 font-medium">{previewProfile.category}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{previewProfile?.download_count || 0} downloads</span>
                    </div>
                    {previewProfile?.updated_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Updated {new Date(previewProfile.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mb-6 max-h-20 overflow-auto px-2">
                    {(previewProfile?.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="bg-purple-700/30 text-purple-200 text-sm px-3 py-1 rounded-full select-none whitespace-nowrap border border-purple-600/30"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-center gap-6">
                    <button
                      onClick={() => previewProfile && handleDownloadBoth(previewProfile)}
                      className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      type="button"
                    >
                      <Download className="h-5 w-5" />
                      Download Combo
                    </button>

                    <button
                      type="button"
                      className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-purple-400 bg-transparent border border-purple-600 rounded-lg hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      onClick={closePreview}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div><Footer /></>
  )
}
