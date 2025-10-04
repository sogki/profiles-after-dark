"use client"

import { useState, useEffect, useMemo, Fragment, useCallback, memo } from "react"
import { Download, Heart, Eye, Search, Clock, Tag } from "lucide-react"
import { Dialog, Transition } from "@headlessui/react"
import { useAuth } from "../context/authContext"
import { useOptimizedGallery } from "../hooks/useOptimizedGallery"
import { supabase } from "../lib/supabase"

interface ProfilePair {
  id: string
  user_id: string
  title: string
  category: string
  tags: string[]
  pfp_url: string
  banner_url: string
  created_at: string
  updated_at: string
  type: "pair"
}

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
  text_data: string
}

type GalleryItem = ProfilePair | Profile

const FAVORITES_STORAGE_KEY = "profile_favorites"

// Skeleton Loading Component
const ProfileCardSkeleton = memo(() => (
  <div
    className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse flex flex-col"
    style={{ minHeight: "320px", maxHeight: "420px" }}
  >
    <div className="w-full h-40 bg-gray-700 flex-shrink-0" />
    <div className="w-20 h-20 bg-gray-700 rounded-full border-4 border-gray-800 absolute -bottom-4 left-1/2 transform -translate-x-1/2" />
    <div className="p-6 pt-8 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-2">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>
        <div className="w-10 h-10 bg-gray-700 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <div className="h-6 bg-gray-700 rounded-full w-16" />
        <div className="h-6 bg-gray-700 rounded-full w-20" />
        <div className="h-6 bg-gray-700 rounded-full w-14" />
      </div>
      <div className="flex items-center justify-between mb-4 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded" />
          <div className="h-4 bg-gray-700 rounded w-8" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded" />
          <div className="h-4 bg-gray-700 rounded w-12" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-gray-700 rounded-lg" />
        <div className="flex-1 h-10 bg-gray-700 rounded-lg" />
      </div>
    </div>
  </div>
))

// Memoized Profile Card Component
interface ProfileCardProps {
  profile: GalleryItem
  onPreview: (profile: GalleryItem) => void
  onDownload: (profile: GalleryItem) => void
  onToggleFavorite: (profileId: string) => void
  isFavorited: boolean
}

const ProfileCard = memo(({ profile, onPreview, onDownload, onToggleFavorite, isFavorited }: ProfileCardProps) => {
  return (
    <div
      className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border border-slate-700 hover:border-slate-600 flex flex-col"
      style={{ minHeight: "320px", maxHeight: "420px" }}
    >
      {/* Banner/Image Display */}
      <div className="relative w-full h-40 flex-shrink-0">
        {"pfp_url" in profile && profile.type === "pair" ? (
          // Profile Pair Display
          <>
            {profile.banner_url ? (
              <img
                src={profile.banner_url || "/placeholder.svg"}
                alt={`${profile.title} banner`}
                className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-gray-400">
                <span className="text-sm">No Banner</span>
              </div>
            )}

            {profile.pfp_url && (
              <img
                src={profile.pfp_url || "/placeholder.svg"}
                alt={`${profile.title} profile`}
                className="w-20 h-20 rounded-full border-4 border-purple-500 absolute -bottom-4 left-1/2 transform -translate-x-1/2 border-solid bg-slate-900 group-hover:border-purple-400 transition-colors shadow-lg"
                loading="lazy"
              />
            )}
          </>
        ) : (
          // Single Profile Display
          <>
            {profile.image_url ? (
              <img
                src={profile.image_url || "/placeholder.svg"}
                alt={profile.title}
                className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-gray-400">
                <span className="text-sm">No Image</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-6 pt-8 flex flex-col h-full">
        {/* Header with title and favorite button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <h3 
              className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors leading-tight"
              title={profile.title}
            >
              {profile.title}
            </h3>
            <p className="text-sm text-gray-400 capitalize mt-1">{profile.category}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(profile.id)
            }}
            className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 ${
              isFavorited
                ? "text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20"
                : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
            }`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Tags - Improved layout with better spacing */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 min-h-[2rem]">
            {profile.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 text-xs bg-slate-700 text-gray-300 rounded-full hover:bg-slate-600 transition-colors border border-slate-600/50"
                title={tag}
              >
                #{tag}
              </span>
            ))}
            {profile.tags.length > 4 && (
              <span 
                className="px-2.5 py-1 text-xs text-gray-400 bg-slate-800 rounded-full border border-slate-600/50"
                title={`${profile.tags.length - 4} more tags: ${profile.tags.slice(4).join(', ')}`}
              >
                +{profile.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Stats - Better layout and information */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4 mt-auto">
          <div className="flex items-center gap-1.5">
            <Download className="w-4 h-4 text-green-400" />
            <span className="font-medium">{profile.download_count || 0}</span>
            <span className="text-xs text-gray-500">downloads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs">
              {new Date(profile.updated_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Actions - Improved button layout */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onPreview(profile)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
            title={`Preview ${profile.title}`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => onDownload(profile)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            title={`Download ${profile.title}`}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  )
})

export default function ProfilesGallery() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  // Pagination
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [previewProfile, setPreviewProfile] = useState<GalleryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Retry function for failed requests
  const retryFetch = useCallback(() => {
    setError(null)
    setLoading(true)
    // Re-trigger the useEffect by updating a dependency
    fetchProfiles()
  }, [])

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const allProfiles: GalleryItem[] = []

      // Try to fetch from profile_pairs table with error handling
      try {
        const { data: pairsData, error: pairsError } = await supabase
          .from("profile_pairs")
          .select("*")
          .order("updated_at", { ascending: false })

        if (pairsError) {
          console.warn("Error fetching profile_pairs:", pairsError)
        } else if (pairsData) {
          const processedPairs: ProfilePair[] = pairsData.map((item) => ({
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
          }))
          allProfiles.push(...processedPairs)
        }
      } catch (err) {
        console.warn("Failed to fetch profile_pairs:", err)
      }

      // Try to fetch from profiles table with error handling
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("updated_at", { ascending: false })

        if (profilesError) {
          console.warn("Error fetching profiles:", profilesError)
        } else if (profilesData) {
          const processedProfiles: Profile[] = profilesData.map((item) => ({
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
          }))
          allProfiles.push(...processedProfiles)
        }
      } catch (err) {
        console.warn("Failed to fetch profiles:", err)
      }

      // If no data was fetched from either table, show a helpful message
      if (allProfiles.length === 0) {
        setError("No profiles found. The database might be empty or there might be a connection issue.")
        setLoading(false)
        return
      }

      // Sort all profiles by updated_at
      allProfiles.sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime()
        const dateB = new Date(b.updated_at).getTime()
        return dateB - dateA
      })

      setProfiles(allProfiles)
    } catch (err) {
      console.error("Unexpected error loading profiles:", err)
      setError("Unexpected error loading profiles. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

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
    fetchProfiles()
  }, [fetchProfiles])

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    profiles.forEach((p) => p.tags?.forEach((tag) => tagsSet.add(tag.toLowerCase().trim())))
    return Array.from(tagsSet)
      .filter((tag) => tag.length > 0) // Remove empty tags
      .sort((a, b) => a.localeCompare(b))
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

      return matchesSearch && matchesTags
    })
  }, [profiles, searchQuery, selectedTags])

  const pagedProfiles = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredProfiles.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProfiles, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedTags])

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

  const handleDownloadBoth = useCallback(async (profile: GalleryItem) => {
    if ("pfp_url" in profile && profile.type === "pair") {
      // Handle profile pair downloads
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
    } else if ("image_url" in profile) {
      // Handle single profile downloads and update download count
      if (profile.image_url) {
        const ext = profile.image_url.split(".").pop()?.split(/[#?]/)[0] || "png"
        const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase()
        const filename = `${sanitizedTitle}.${ext}`
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
              prev.map((p) =>
                p.id === profile.id && "download_count" in p ? { ...p, download_count: p.download_count + 1 } : p,
              ),
            )
          }
        } catch (error) {
          console.error("Failed to update download count:", error)
        }
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

  const openPreview = (profile: GalleryItem) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative" data-gallery style={{ zIndex: 10 }}>
      {/* Enhanced Header */}
      <div className="mb-8 pt-24">
        <h2 className="text-white text-4xl font-bold mb-2">Profiles Gallery</h2>
        <p className="text-gray-400 text-lg">
          Discover and download amazing profile combinations • {filteredProfiles.length} items available
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
              aria-label="Search profiles"
            />
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
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    selectedTags.has(tag)
                      ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25 scale-105"
                      : "bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white"
                  }`}
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
        {(searchQuery || selectedTags.size > 0) && (
          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>
                  Showing {filteredProfiles.length} of {profiles.length} profiles
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTags(new Set())
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
              >
                Reset all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profiles grid */}
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
              onClick={retryFetch}
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
            <h3 className="text-xl font-semibold mb-2 text-white">No profiles found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
            {(searchQuery || selectedTags.size > 0) && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTags(new Set())
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pagedProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onPreview={openPreview}
                onDownload={handleDownloadBoth}
                onToggleFavorite={handleFavorite}
                isFavorited={favorites.has(profile.id)}
              />
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
                        className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                          page === pageNum
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  },
                )}
                {Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE) > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => setPage(Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE))}
                      className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                        page === Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      }`}
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
                  {previewProfile && "pfp_url" in previewProfile && previewProfile.type === "pair" ? (
                    // Profile Pair Preview
                    <>
                      {previewProfile.banner_url && (
                        <img
                          src={previewProfile.banner_url || "/placeholder.svg"}
                          alt={`${previewProfile.title} banner`}
                          className="w-full h-64 object-cover brightness-75"
                          loading="lazy"
                        />
                      )}
                      {previewProfile.pfp_url && (
                        <img
                          src={previewProfile.pfp_url || "/placeholder.svg"}
                          alt={`${previewProfile.title} profile`}
                          className="w-32 h-32 rounded-full border-4 border-purple-500 absolute top-48 left-1/2 transform -translate-x-1/2 bg-slate-900"
                          loading="lazy"
                        />
                      )}
                    </>
                  ) : (
                    // Single Profile Preview
                    previewProfile &&
                    "image_url" in previewProfile && (
                      <img
                        src={previewProfile.image_url || "/placeholder.svg"}
                        alt={previewProfile.title}
                        className="w-full h-64 object-cover brightness-75"
                        loading="lazy"
                      />
                    )
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

                  {/* Replace the stats section in the modal (around line 710) */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    <div className="flex items-center gap-1">
                      <span className="text-purple-300 font-medium">{previewProfile?.category}</span>
                    </div>
                    {previewProfile && "download_count" in previewProfile && (
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{previewProfile.download_count} downloads</span>
                      </div>
                    )}
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

                  {/* Also fix the text_data section */}
                  {previewProfile && "text_data" in previewProfile && previewProfile.text_data && (
                    <div className="mb-6 p-4 bg-slate-800 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                      <p className="text-gray-300">{previewProfile.text_data}</p>
                    </div>
                  )}

                  <div className="flex justify-center gap-6">
                    <button
                      onClick={() => previewProfile && handleDownloadBoth(previewProfile)}
                      className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      type="button"
                    >
                      <Download className="h-5 w-5" />
                      Download {previewProfile && "pfp_url" in previewProfile ? "Profile Combo" : "Profile"}
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
    </div>
  )
}
