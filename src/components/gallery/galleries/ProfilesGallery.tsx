import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "../../../context/authContext"
import { supabase } from "../../../lib/supabase"
import { User } from "@supabase/supabase-js"
import ProfileCard from "./../profiles-gallery-modular/ProfileCard"
import ProfileCardSkeleton from "./../profiles-gallery-modular/ProfileCardSkeleton"
import FilterSection from "./../profiles-gallery-modular/FilterSection"
import Pagination from "./../profiles-gallery-modular/Pagination"
import PreviewModal from "./../profiles-gallery-modular/PreviewModal"
import Footer from "../../Footer"
import { Search } from "lucide-react"

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
  source: "profile_pairs"
}

interface Profile {
  id: string
  user_id?: string
  title: string
  category?: string
  tags?: string[]
  image_url: string
  text_data?: string
  download_count?: number
  created_at?: string
  updated_at?: string
  color?: string
  source: "profiles"
}

interface RawProfilePair {
  id: string
  user_id?: string | null
  title: string | null
  category?: string | null
  tags: string | string[] | null
  pfp_url: string
  banner_url: string
  download_count: number | null
  created_at?: string | null
  updated_at?: string | null
  color?: string | null
}

interface RawProfile {
  id: string
  user_id?: string | null
  title: string | null
  category?: string | null
  tags: string | string[] | null
  image_url: string | null
  text_data?: string | null
  download_count: number | null
  created_at?: string | null
  updated_at?: string | null
  color?: string | null
}

type ProfileItem = Profile | ProfilePair

interface GalleryProps {
  searchQuery: string
  selectedCategory: string
  selectedType: string
  viewMode: "list" | "grid"
}

const FAVORITES_STORAGE_KEY = "profile_favorites"

export default function ProfilesGallery({ searchQuery: externalSearchQuery, selectedCategory, selectedType, viewMode }: GalleryProps) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [internalSearchQuery, setInternalSearchQuery] = useState(externalSearchQuery)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedColor, setSelectedColor] = useState<string | "all">("all")
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [previewProfile, setPreviewProfile] = useState<ProfileItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    setInternalSearchQuery(externalSearchQuery)
  }, [externalSearchQuery])

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
        // Fetch from profile_pairs
        const { data: pairsData, error: pairsError } = await supabase
          .from("profile_pairs")
          .select("*")
          .not("pfp_url", "is", null)
          .not("banner_url", "is", null)
          .neq("pfp_url", "")
          .neq("banner_url", "")
          .order("updated_at", { ascending: false })

        if (pairsError) {
          setError("Failed to fetch profile combos")
          setLoading(false)
          return
        }

        const pairs: ProfilePair[] = (pairsData || []).map((item: RawProfilePair) => {
          let tags: string[] = []
          try {
            if (Array.isArray(item.tags)) {
              tags = item.tags
            } else if (item.tags) {
              if (typeof item.tags === "string" && item.tags.includes("[")) {
                tags = JSON.parse(item.tags)
              } else if (typeof item.tags === "string") {
                tags = item.tags.split(",").map((t) => t.trim())
              }
            }
          } catch (e) {
            console.error("Error parsing tags for profile pair", item.id, e)
          }

          return {
            id: item.id,
            user_id: item.user_id ?? undefined,
            title: item.title || "Untitled Profile Combo",
            category: item.category || "General",
            tags,
            pfp_url: item.pfp_url,
            banner_url: item.banner_url,
            download_count: item.download_count ?? 0,
            created_at: item.created_at ?? undefined,
            updated_at: item.updated_at ?? undefined,
            color: item.color ?? undefined,
            source: "profile_pairs" as const,
          }
        })

        // Fetch from profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .not("image_url", "is", null)
          .neq("image_url", "")
          .order("updated_at", { ascending: false })

        if (profilesError) {
          setError("Failed to fetch profiles")
          setLoading(false)
          return
        }

        const profiles: Profile[] = (profilesData || []).map((item: RawProfile) => {
          let tags: string[] = []
          try {
            if (Array.isArray(item.tags)) {
              tags = item.tags
            } else if (item.tags) {
              if (typeof item.tags === "string" && item.tags.includes("[")) {
                tags = JSON.parse(item.tags)
              } else if (typeof item.tags === "string") {
                tags = item.tags.split(",").map((t) => t.trim())
              }
            }
          } catch (e) {
            console.error("Error parsing tags for profile", item.id, e)
          }

          return {
            id: item.id,
            user_id: item.user_id ?? undefined,
            title: item.title || "Untitled Profile",
            category: item.category || "General",
            tags,
            image_url: item.image_url || "/placeholder.svg",
            text_data: item.text_data ?? undefined,
            download_count: item.download_count ?? 0,
            created_at: item.created_at ?? undefined,
            updated_at: item.updated_at ?? undefined,
            color: item.color ?? undefined,
            source: "profiles" as const,
          }
        })

        // Combine and sort by updated_at
        const combinedProfiles: ProfileItem[] = [...pairs, ...profiles].sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
          return dateB - dateA
        })

        setProfiles(combinedProfiles)
      } catch (err) {
        setError("Unexpected error loading profiles")
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
        internalSearchQuery === "" ||
        profile.title.toLowerCase().includes(internalSearchQuery.toLowerCase()) ||
        (profile.category && profile.category.toLowerCase().includes(internalSearchQuery.toLowerCase())) ||
        profile.tags?.some((tag) => tag.toLowerCase().includes(internalSearchQuery.toLowerCase()))

      const matchesTags =
        selectedTags.size === 0 || profile.tags?.some((tag) => selectedTags.has(tag.toLowerCase().trim()))

      const matchesColor = selectedColor === "all" || profile.color === selectedColor

      const matchesCategory =
        selectedCategory === "all" || (profile.category && profile.category.toLowerCase() === selectedCategory.toLowerCase())

      const matchesType =
        selectedType === "all" || ("source" in profile && profile.source === selectedType)

      return matchesSearch && matchesTags && matchesColor && matchesCategory && matchesType
    })
  }, [profiles, internalSearchQuery, selectedTags, selectedColor, selectedCategory, selectedType])

  const pagedProfiles = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredProfiles.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProfiles, page])

  useEffect(() => {
    setPage(1)
  }, [internalSearchQuery, selectedTags, selectedColor, selectedCategory, selectedType])

  const handleDownloadBoth = useCallback(async (profile: ProfileItem) => {
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

    const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase()
    if (profile.source === "profiles" && "image_url" in profile && profile.image_url) {
      const ext = profile.image_url.split(".").pop()?.split(/[#?]/)[0] || "png"
      const filename = `profile_${sanitizedTitle}.${ext}`
      await downloadImage(profile.image_url, filename)
    } else if (profile.source === "profile_pairs" && "pfp_url" in profile && "banner_url" in profile) {
      if (profile.pfp_url) {
        const extPfp = profile.pfp_url.split(".").pop()?.split(/[#?]/)[0] || "png"
        const pfpFilename = `pfp_${sanitizedTitle}.${extPfp}`
        await downloadImage(profile.pfp_url, pfpFilename)
      }
      if (profile.banner_url) {
        const extBanner = profile.banner_url.split(".").pop()?.split(/[#?]/)[0] || "png"
        const bannerFilename = `banner_${sanitizedTitle}.${extBanner}`
        await downloadImage(profile.banner_url, bannerFilename)
      }
    }

    try {
      const table = profile.source === "profiles" ? "profiles" : "profile_pairs"
      const { error } = await supabase
        .from(table)
        .update({ download_count: (profile.download_count || 0) + 1 })
        .eq("id", profile.id)

      if (!error) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === profile.id ? { ...p, download_count: (p.download_count || 0) + 1 } : p))
        )
      }
    } catch (error) {
      console.error("Failed to update download count:", error)
    }
  }, [])

  const handleFavorite = async (profileId: string) => {
    if (!user) return

    const isCurrentlyFavorited = favorites.has(profileId)

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
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("profile_id", profileId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("favorites").insert([{ user_id: user.id, profile_id: profileId }])
        if (error) throw error
      }
    } catch (error) {
      console.error("Failed to update favorites:", error)
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

  const openPreview = (profile: ProfileItem) => {
    setPreviewProfile(profile)
    setIsModalOpen(true)
  }

  const closePreview = () => {
    setIsModalOpen(false)
    setPreviewProfile(null)
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-gallery>
        <div className="mb-8">
          <h2 className="text-white text-4xl font-bold mb-2">Profile Combos Gallery</h2>
          <p className="text-gray-400 text-lg">
            Discover and download complete profile sets with matching PFPs and banners • {filteredProfiles.length} combos available
          </p>
        </div>

        <FilterSection
          searchQuery={internalSearchQuery}
          setSearchQuery={setInternalSearchQuery}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          allTags={allTags}
          allColors={allColors}
          profiles={profiles}
          filteredProfiles={filteredProfiles}
          viewMode={viewMode}
        />

        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-4"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProfileCardSkeleton key={i} viewMode={viewMode} />
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
              <h3 className="text-xl font-semibold mb-2 text-white">No profile combos found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
              {(internalSearchQuery || selectedTags.size > 0 || selectedColor !== "all") && (
                <button
                  onClick={() => {
                    setInternalSearchQuery("")
                    setSelectedTags(new Set())
                    setSelectedColor("all")
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
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-4"}>
              {pagedProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  viewMode={viewMode}
                  favorites={favorites}
                  handleDownloadBoth={handleDownloadBoth}
                  handleFavorite={handleFavorite}
                  openPreview={openPreview}
                  user={user}
                />
              ))}
            </div>

            <Pagination
              filteredProfiles={filteredProfiles}
              page={page}
              setPage={setPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />

            <PreviewModal
              isOpen={isModalOpen}
              closePreview={closePreview}
              previewProfile={previewProfile}
              handleDownloadBoth={handleDownloadBoth}
            />
          </>
        )}
      </div>
      <Footer />
    </>
  )
}