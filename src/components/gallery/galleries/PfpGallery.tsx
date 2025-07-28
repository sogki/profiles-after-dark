import { useState, useEffect, useMemo, Fragment, useCallback } from "react"
import { Download, Heart, Eye, Search, Clock, Tag, Grid3X3, List, Palette } from "lucide-react"
import { Dialog, Transition } from "@headlessui/react"
import { useAuth } from "../../../context/authContext"
import { supabase } from "../../../lib/supabase"
import Footer from "../../Footer"

interface Profile {
  id: string
  user_id: string
  title: string
  category: string
  type: string
  image_url: string
  download_count: number
  tags: string[]
  created_at: string
  updated_at: string
  color?: string
}

const FAVORITES_STORAGE_KEY = "pfp_favorites"

// Skeleton Loading Component
const PfpCardSkeleton = () => (
  <div className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
    <div className="aspect-square bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-700 rounded w-3/4" />
      <div className="flex justify-center gap-2">
        <div className="h-4 bg-gray-700 rounded w-12" />
        <div className="h-4 bg-gray-700 rounded w-16" />
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <div className="h-8 w-8 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
      </div>
    </div>
  </div>
)

export default function PfpGallery() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedColor, setSelectedColor] = useState<string | "all">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Pagination
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [previewProfile, setPreviewProfile] = useState<Profile | null>(null)
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
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("type", "profile")
          .order("updated_at", { ascending: false })

        if (error) {
          setError("Failed to fetch profile pictures")
          setLoading(false)
          return
        }

        const profilesData: Profile[] = (data || []).map((item) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.title || "Untitled PFP",
          category: item.category || "General",
          type: item.type || "profile",
          image_url: item.image_url || "",
          download_count: item.download_count || 0,
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item.created_at,
          updated_at: item.updated_at,
          color: item.color || undefined,
        }))

        setProfiles(profilesData)
      } catch (err) {
        setError("Unexpected error loading profile pictures")
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

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        searchQuery === "" ||
        profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTags =
        selectedTags.size === 0 || profile.tags?.some((tag) => selectedTags.has(tag.toLowerCase().trim()))

      const matchesColor = selectedColor === "all" || profile.color === selectedColor

      return matchesSearch && matchesTags && matchesColor
    })
  }, [profiles, searchQuery, selectedTags, selectedColor])

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

  const handleDownload = useCallback(async (profile: Profile) => {
    if (profile.image_url) {
      const ext = profile.image_url.split(".").pop()?.split(/[#?]/)[0] || "png"
      const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase()
      const filename = `pfp_${sanitizedTitle}.${ext}`
      await downloadImage(profile.image_url, filename)

      // Update download count in database
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ download_count: profile.download_count + 1 })
          .eq("id", profile.id)

        if (!error) {
          // Update local state
          setProfiles((prev) =>
            prev.map((p) => (p.id === profile.id ? { ...p, download_count: p.download_count + 1 } : p)),
          )
        }
      } catch (error) {
        console.error("Failed to update download count:", error)
      }
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

  const openPreview = (profile: Profile) => {
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

  return (
    <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-gallery>
      {/* Enhanced Header */}
      <div className="mb-8">
        <h2 className="text-white text-4xl font-bold mb-2">Profile Pictures Gallery</h2>
        <p className="text-gray-400 text-lg">
          Discover and download amazing profile pictures • {filteredProfiles.length} items available
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
              aria-label="Search profile pictures" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        {(searchQuery || selectedTags.size > 0 || selectedColor !== "all") && (
          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>
                  Showing {filteredProfiles.length} of {profiles.length} profile pictures
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTags(new Set())
                  setSelectedColor("all")
                } }
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
              >
                Reset all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profiles grid/list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <PfpCardSkeleton key={i} />
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
            <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">No profile pictures found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
            {(searchQuery || selectedTags.size > 0 || selectedColor !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTags(new Set())
                  setSelectedColor("all")
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
            className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-4"}
          >
            {pagedProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border border-slate-700 hover:border-slate-600 ${viewMode === "list" ? "flex" : ""}`}
              >
                {/* Image Display */}
                <div
                  className={`relative overflow-hidden ${viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "aspect-square"}`}
                >
                  <img
                    src={profile.image_url || "/placeholder.svg"}
                    alt={profile.title}
                    className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
                    loading="lazy" />

                  {/* Stats Overlay */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <Download className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-gray-300">{profile.download_count}</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <span className="text-xs text-purple-300 font-medium">{profile.category}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`text-center ${viewMode === "list" ? "flex-1 p-4 flex flex-col justify-center" : "p-6"}`}
                >
                  <h3 className="text-white font-semibold text-xl truncate mb-3">{profile.title}</h3>

                  <div className="flex flex-wrap justify-center gap-1 mb-4 max-h-16 overflow-auto px-2">
                    {(profile.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => openPreview(profile)}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
                      aria-label={`Preview ${profile.title}`}
                      type="button"
                    >
                      <Eye size={16} />
                      Preview
                    </button>

                    <button
                      onClick={() => handleDownload(profile)}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
                      aria-label={`Download ${profile.title}`}
                      type="button"
                    >
                      <Download size={16} />
                      Download
                    </button>

                    {user && (
                      <button
                        onClick={() => handleFavorite(profile.id)}
                        className={`p-2 rounded-lg transition-colors ${favorites.has(profile.id)
                            ? "bg-red-600 text-white"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}
                        aria-pressed={favorites.has(profile.id)}
                        aria-label={favorites.has(profile.id)
                          ? `Remove ${profile.title} from favorites`
                          : `Add ${profile.title} to favorites`}
                        type="button"
                      >
                        <Heart size={16} fill={favorites.has(profile.id) ? "currentColor" : "none"} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
              <Dialog.Panel className="inline-block w-full max-w-4xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
                <div className="relative">
                  {previewProfile && (
                    <img
                      src={previewProfile.image_url || "/placeholder.svg"}
                      alt={previewProfile.title}
                      className="w-full h-96 object-contain bg-slate-800"
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

                <div className="p-8">
                  <Dialog.Title as="h3" className="text-3xl font-bold leading-12 text-white mb-5">
                    {previewProfile?.title}
                  </Dialog.Title>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    <div className="flex items-center gap-1">
                      <span className="text-purple-300 font-medium">{previewProfile?.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{previewProfile?.download_count} downloads</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Updated {new Date(previewProfile?.updated_at || "").toLocaleDateString()}</span>
                    </div>
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
                      onClick={() => previewProfile && handleDownload(previewProfile)}
                      className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      type="button"
                    >
                      <Download className="h-5 w-5" />
                      Download Profile Picture
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
